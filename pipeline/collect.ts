// PR差分・PR本文・Backlog課題・テスト結果を集めて out/<課題キー>/sources.json に保存する
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "./lib/env";
import { run } from "./lib/exec";
import { paths, writeJson, type PipelineContext, type Sources, type TestCaseResult } from "./lib/context";

/** 台本の材料として渡す差分の上限（文字数） */
const MAX_DIFF_CHARS = 40_000;

/** 変更後の画面のソース（app/src/ 以下の .ts / .tsx）。撮影手順を考える材料にする */
function readAppSource(): string {
  const files = readdirSync("app/src", { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith("seed.ts"))
    .sort();
  return files.map((f) => `--- app/src/${f.replaceAll("\\", "/")}\n${readFileSync(join("app/src", f), "utf8")}`).join("\n");
}

function findPullRequest(issueKey: string): number {
  if (process.env.PR_NUMBER) return Number(process.env.PR_NUMBER);
  const out = run("gh", ["pr", "list", "--state", "merged", "--head", `feature/${issueKey}`, "--json", "number", "--jq", ".[0].number"]);
  const number = Number(out.trim());
  if (!number) throw new Error(`feature/${issueKey} のマージ済みPRが見つかりません`);
  return number;
}

async function fetchIssue(issueKey: string): Promise<Sources["issue"]> {
  const domain = env("BACKLOG_DOMAIN");
  const res = await fetch(`https://${domain}/api/v2/issues/${issueKey}?apiKey=${encodeURIComponent(env("BACKLOG_API_KEY"))}`);
  if (!res.ok) throw new Error(`Backlog の課題 ${issueKey} を取得できません: HTTP ${res.status}`);
  const issue = (await res.json()) as { summary: string; description: string };
  return { summary: issue.summary, description: issue.description ?? "", url: `https://${domain}/view/${issueKey}` };
}

type PlaywrightSuite = { title: string; specs?: { title: string; ok: boolean }[]; suites?: PlaywrightSuite[] };

function flattenSpecs(suites: PlaywrightSuite[] = []): TestCaseResult[] {
  return suites.flatMap((s) => [...(s.specs ?? []).map((spec) => ({ title: spec.title, ok: spec.ok })), ...flattenSpecs(s.suites)]);
}

/** 変更後のコードでテストを実行し、結果を集める（不合格があっても止めずに記録する） */
function runTests(ctx: PipelineContext): TestCaseResult[] {
  const output = paths(ctx).testResults;
  run("npx", ["playwright", "test", "--reporter=json"], {
    allowFailure: true,
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: output },
  });
  if (!existsSync(output)) throw new Error("テスト結果のファイルができませんでした");
  const report = JSON.parse(readFileSync(output, "utf8")) as { suites: PlaywrightSuite[] };
  return flattenSpecs(report.suites);
}

export async function collect(ctx: PipelineContext): Promise<void> {
  const number = findPullRequest(ctx.issueKey);
  const pr = JSON.parse(run("gh", ["pr", "view", String(number), "--json", "number,title,body,url,mergeCommit"])) as {
    number: number;
    title: string;
    body: string;
    url: string;
    mergeCommit: { oid: string } | null;
  };
  if (!pr.mergeCommit) throw new Error(`PR #${number} はまだマージされていません`);
  const mergeCommit = pr.mergeCommit.oid;
  const baseCommit = run("git", ["rev-parse", `${mergeCommit}^1`]).trim();

  let diff = run("gh", ["pr", "diff", String(number)]);
  if (diff.length > MAX_DIFF_CHARS) diff = diff.slice(0, MAX_DIFF_CHARS) + "\n…（以下省略）";

  const tests = runTests(ctx);
  const sources: Sources = {
    issueKey: ctx.issueKey,
    issue: await fetchIssue(ctx.issueKey),
    pr: { number: pr.number, title: pr.title, body: pr.body, url: pr.url, mergeCommit, baseCommit },
    diff,
    appSource: readAppSource(),
    tests,
  };
  writeJson(paths(ctx).sources, sources);
  console.log(`  PR #${pr.number}、テスト ${tests.length} 件（不合格 ${tests.filter((t) => !t.ok).length} 件）`);
}
