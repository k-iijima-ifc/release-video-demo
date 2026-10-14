// Backlog の課題に動画を添付してコメントし、状態を完了にする。PRにもコメントする
import { readFileSync } from "node:fs";
import { env, optionalEnv } from "./lib/env";
import { run } from "./lib/exec";
import { paths, readJson, readManifest, type PipelineContext, type Sources } from "./lib/context";
import type { ReleaseScript } from "../video/src/types";

const backlog = (path: string) => `https://${env("BACKLOG_DOMAIN")}/api/v2${path}?apiKey=${encodeURIComponent(env("BACKLOG_API_KEY"))}`;

async function backlogFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(backlog(path), init);
  if (!res.ok) throw new Error(`Backlog ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** 動画を Backlog に一時アップロードし、添付ファイルIDを得る */
async function uploadVideo(ctx: PipelineContext): Promise<number> {
  const form = new FormData();
  form.append("file", new Blob([readFileSync(paths(ctx).video)], { type: "video/mp4" }), `release-${ctx.issueKey}.mp4`);
  const res = await backlogFetch<{ id: number }>("/space/attachment", { method: "POST", body: form });
  return res.id;
}

/** Actions の実行ページ（ローカル実行ならなし） */
function actionsRunUrl(): string | undefined {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  return GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : undefined;
}

export async function deliver(ctx: PipelineContext): Promise<void> {
  const script = readJson<ReleaseScript>(paths(ctx).script);
  const sources = readJson<Sources>(paths(ctx).sources);
  const manifest = readManifest(ctx);
  const seconds = Object.values(manifest.scenes).reduce((sum, s) => sum + (s?.narrationSeconds ?? 0), 0);
  const passed = sources.tests.filter((t) => t.ok).length;
  const runUrl = actionsRunUrl();

  const comment = [
    `リリース紹介動画ができました（約${Math.round(seconds / 5) * 5}秒）。`,
    `「${script.title}」`,
    "",
    `添付の release-${ctx.issueKey}.mp4 をご覧ください。`,
    `確認したテスト：${sources.tests.length}件中${passed}件合格`,
    `PR：${sources.pr.url}`,
    ...(runUrl ? [`作成した処理：${runUrl}`] : []),
    "",
    "※ この動画とコメントは、PRのマージをきっかけに自動で作成しました。",
  ].join("\n");

  const attachmentId = await uploadVideo(ctx);
  const body = new URLSearchParams({ comment, "attachmentId[]": String(attachmentId) });
  const doneStatusId = optionalEnv("BACKLOG_DONE_STATUS_ID");
  if (doneStatusId) body.set("statusId", doneStatusId);
  await backlogFetch(`/issues/${ctx.issueKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  console.log(`  Backlog の課題 ${ctx.issueKey} に動画を添付してコメントし、状態を更新しました`);

  const issueUrl = sources.issue.url;
  run("gh", ["pr", "comment", String(sources.pr.number), "--body-file", "-"], {
    input: `リリース紹介動画を Backlog の課題に添付しました：${issueUrl}${runUrl ? `\n（動画は ${runUrl} の成果物からもダウンロードできます）` : ""}`,
  });
  console.log(`  PR #${sources.pr.number} にコメントしました`);
}
