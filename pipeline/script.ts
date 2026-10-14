// Claude Code（claude -p）で sources.json から out/<課題キー>/script.json を作る
import { run } from "./lib/exec";
import { paths, readJson, writeJson, type PipelineContext, type Sources } from "./lib/context";
import type { CaptureStep, ReleaseScript, Scene, SceneId } from "../video/src/types";

const SCENE_IDS: SceneId[] = ["opening", "summary", "before_after", "tests", "closing"];

function buildPrompt(sources: Sources): string {
  const tests = sources.tests.map((t, i) => `${i}. ${t.ok ? "合格" : "不合格"}：${t.title}`).join("\n");
  return `あなたは社内の利用部門向けに、システム改修のリリース紹介動画の台本を書く担当者です。
次の材料だけを使って、約60〜75秒の動画の台本をJSONで書いてください。ツールは使わず、JSONだけを出力してください。

# ルール
- 読み手は利用部門。技術用語（バリデーション、コンポーネント、フォーカス等）は使わず、利用者から見た変化で書く
- ナレーションは一文40文字程度まで。全シーン合計で300〜400文字
- 材料に書かれていないことは書かない。不合格のテストがあれば隠さずに伝える
- narration は字幕に出す文で、通常の表記で書く
- speech は読み上げ用で、narration と同じ文を同じ順に並べ、英字の略語や課題キーだけ読み方をカタカナにする（例：AISTUDYDEMO-1 →「エーアイ スタディ デモ イチ」）。置き換えるものがなければ narration と同じでよい
- 字幕は1文ずつ表示するので、1文は40文字程度までにする

# 出力するJSONの形
{
  "title": "動画のタイトル（〜しました、の形で30文字以内）",
  "scenes": [
    { "id": "opening", "heading": "見出し", "narration": "導入の一文", "speech": "読み上げ用" },
    { "id": "summary", "heading": "何が変わったか", "narration": "...", "speech": "...", "points": ["要点（20文字以内）を3つまで"] },
    { "id": "before_after", "heading": "変更前と変更後", "narration": "変更前と変更後の画面の違いの説明", "speech": "..." },
    { "id": "tests", "heading": "確認したこと", "narration": "確認した内容と結果", "speech": "...", "results": [{ "index": テスト番号, "case": "画面に出す短い説明（25文字以内）" }] },
    { "id": "closing", "heading": "見出し", "narration": "締めの一文（課題キーを含める）", "speech": "..." }
  ]
}
results には下のテスト結果をすべて、番号どおりに含めること（合否はこちらで実際の結果を入れる）。

さらに、トップレベルに "capture" を加えること。これは「変更前と変更後」のシーンで使う画面写真を撮るための操作手順で、
変更前と変更後の画面に同じ操作をして撮り比べる。違いが一番よくわかる状態で終わるようにすること。
撮影はお問い合わせフォーム（#/）から始まる。撮るのは最後に表示している画面の本文部分。
使える操作は次の6つだけ（label は画面の項目名、text はボタンやリンクの文字）：
- { "action": "goto", "path": "#/admin" }（画面を移動する。#/ お問い合わせ、#/admin 問い合わせ一覧、#/admin/inquiries/1003 詳細）
- { "action": "fill", "label": "お名前", "value": "山田 太郎" }（"repeat": 回数 を付けると value を繰り返して入力する）
- { "action": "select", "label": "お問い合わせ種別", "value": "product" }
- { "action": "click", "text": "送信する" }
- { "action": "press", "key": "Tab" }
- { "action": "wait", "ms": 1000 }
変更前の画面にないボタンなどへの操作はスキップされる。最後は "wait" で表示が落ち着くのを待つこと。
変更後の画面のソースとテストのコードを参考に、実在する項目名とボタンの文字を使うこと。

# 課題（${sources.issueKey}）
件名：${sources.issue.summary}
${sources.issue.description}

# PR #${sources.pr.number}：${sources.pr.title}
${sources.pr.body}

# テスト結果（全${sources.tests.length}件、合格${sources.tests.filter((t) => t.ok).length}件）
${tests}

# 変更後の画面のソース（app/src/ 以下）
${sources.appSource}

# 差分
${sources.diff}
`;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`台本のJSONが見つかりません:\n${text.slice(0, 500)}`);
  return JSON.parse(text.slice(start, end + 1));
}

type DraftScene = Omit<Scene, "results"> & { results?: { index: number; case: string }[] };

/** 撮影手順のうち、形が正しいものだけを残す */
function validCapture(steps: unknown): CaptureStep[] {
  if (!Array.isArray(steps)) return [];
  return steps.filter((s): s is CaptureStep => {
    switch (s?.action) {
      case "goto":
        return typeof s.path === "string" && s.path.startsWith("#/");
      case "fill":
        return typeof s.label === "string" && typeof s.value === "string";
      case "select":
        return typeof s.label === "string" && typeof s.value === "string";
      case "click":
        return typeof s.text === "string";
      case "press":
        return typeof s.key === "string";
      case "wait":
        return typeof s.ms === "number" && s.ms <= 5000;
      default:
        return false;
    }
  });
}

/** Claude の出力を検証し、テストの合否は実際の結果で上書きする */
function finalize(draft: { title: string; scenes: DraftScene[]; capture?: unknown }, sources: Sources): ReleaseScript {
  const scenes = SCENE_IDS.map((id) => {
    const scene = draft.scenes.find((s) => s.id === id);
    if (!scene?.narration) throw new Error(`台本にシーン ${id} のナレーションがありません`);
    return scene;
  });
  const tests = scenes.find((s) => s.id === "tests")!;
  const labels = new Map((tests.results ?? []).map((r) => [r.index, r.case]));
  const results = sources.tests.map((t, i) => ({ case: labels.get(i) ?? t.title, pass: t.ok }));

  return {
    issueKey: sources.issueKey,
    issueUrl: sources.issue.url,
    title: draft.title,
    audience: "利用部門",
    scenes: scenes.map((s) => (s.id === "tests" ? { ...s, results } : (s as Scene))),
    capture: validCapture(draft.capture),
  };
}

export async function generateScript(ctx: PipelineContext): Promise<void> {
  const sources = readJson<Sources>(paths(ctx).sources);
  const output = run("claude", ["-p", "--output-format", "json", "--max-turns", "1"], { input: buildPrompt(sources) });
  const result = JSON.parse(output) as { result?: string; is_error?: boolean; total_cost_usd?: number };
  if (result.is_error || !result.result) throw new Error(`Claude Code が台本を返しませんでした: ${output.slice(0, 500)}`);

  const script = finalize(extractJson(result.result) as Parameters<typeof finalize>[0], sources);
  writeJson(paths(ctx).script, script);
  const chars = script.scenes.reduce((n, s) => n + s.narration.length, 0);
  console.log(`  「${script.title}」ナレーション ${chars} 文字（費用 $${result.total_cost_usd?.toFixed(3) ?? "?"}）`);
}
