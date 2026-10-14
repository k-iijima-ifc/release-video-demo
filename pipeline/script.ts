// Claude Code（claude -p）で sources.json から out/<課題キー>/script.json を作る
import { run } from "./lib/exec";
import { paths, readJson, writeJson, type PipelineContext, type Sources } from "./lib/context";
import type { ReleaseScript, Scene, SceneId } from "../video/src/types";

const SCENE_IDS: SceneId[] = ["opening", "summary", "before_after", "tests", "closing"];

function buildPrompt(sources: Sources): string {
  const tests = sources.tests.map((t, i) => `${i}. ${t.ok ? "合格" : "不合格"}：${t.title}`).join("\n");
  return `あなたは社内の利用部門向けに、システム改修のリリース紹介動画の台本を書く担当者です。
次の材料だけを使って、約60〜75秒の動画の台本をJSONで書いてください。ツールは使わず、JSONだけを出力してください。

# ルール
- 読み手は利用部門。技術用語（バリデーション、コンポーネント、フォーカス等）は使わず、利用者から見た変化で書く
- ナレーションは一文40文字程度まで。全シーン合計で300〜400文字
- 材料に書かれていないことは書かない。不合格のテストがあれば隠さずに伝える
- ナレーションは読み上げに使う。英字の略語や課題キーは読み方をカタカナで書く（例：AISTUDYDEMO-1 →「エーアイ スタディ デモ イチ」）
- 画面に出す文字（title、heading、points、results[].case）は通常の表記でよい

# 出力するJSONの形
{
  "title": "動画のタイトル（〜しました、の形で30文字以内）",
  "scenes": [
    { "id": "opening", "heading": "見出し", "narration": "導入の一文" },
    { "id": "summary", "heading": "何が変わったか", "narration": "...", "points": ["要点（20文字以内）を3つまで"], "icon": "この変更を表すアイコンの英語の説明（PixelLabでドット絵にする。例: red warning sign with exclamation mark）" },
    { "id": "before_after", "heading": "変更前と変更後", "narration": "変更前と変更後の画面の違いの説明" },
    { "id": "tests", "heading": "確認したこと", "narration": "確認した内容と結果", "results": [{ "index": テスト番号, "case": "画面に出す短い説明（25文字以内）" }] },
    { "id": "closing", "heading": "見出し", "narration": "締めの一文（課題キーの読み方を含める）" }
  ]
}
results には下のテスト結果をすべて、番号どおりに含めること（合否はこちらで実際の結果を入れる）。

# 課題（${sources.issueKey}）
件名：${sources.issue.summary}
${sources.issue.description}

# PR #${sources.pr.number}：${sources.pr.title}
${sources.pr.body}

# テスト結果（全${sources.tests.length}件、合格${sources.tests.filter((t) => t.ok).length}件）
${tests}

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

/** Claude の出力を検証し、テストの合否は実際の結果で上書きする */
function finalize(draft: { title: string; scenes: DraftScene[] }, sources: Sources): ReleaseScript {
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
  };
}

export async function generateScript(ctx: PipelineContext): Promise<void> {
  const sources = readJson<Sources>(paths(ctx).sources);
  const output = run("claude", ["-p", "--output-format", "json", "--max-turns", "1"], { input: buildPrompt(sources) });
  const result = JSON.parse(output) as { result?: string; is_error?: boolean; total_cost_usd?: number };
  if (result.is_error || !result.result) throw new Error(`Claude Code が台本を返しませんでした: ${output.slice(0, 500)}`);

  const script = finalize(extractJson(result.result) as { title: string; scenes: DraftScene[] }, sources);
  writeJson(paths(ctx).script, script);
  const chars = script.scenes.reduce((n, s) => n + s.narration.length, 0);
  console.log(`  「${script.title}」ナレーション ${chars} 文字（費用 $${result.total_cost_usd?.toFixed(3) ?? "?"}）`);
}
