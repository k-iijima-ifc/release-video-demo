// デモ用の改善要望をBacklogに起票する。リハーサルのたびに新しい課題を作るときにも使う
// 使い方: npm run demo:issue -- [パターン]（pipeline/demo-issues.ts のキー。省略時は input-check）
import { env } from "./lib/env";
import { DEMO_ISSUES, type DemoPattern } from "./demo-issues";

const pattern = (process.argv[2] || "input-check") as DemoPattern;
if (!(pattern in DEMO_ISSUES)) {
  console.error(`パターンは ${Object.keys(DEMO_ISSUES).join(" / ")} のどれかを指定してください`);
  process.exit(1);
}
const { summary, description } = DEMO_ISSUES[pattern];

const base = `https://${env("BACKLOG_DOMAIN")}/api/v2`;
const auth = `apiKey=${encodeURIComponent(env("BACKLOG_API_KEY"))}`;
const projectKey = env("BACKLOG_PROJECT_KEY");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}${path.includes("?") ? "&" : "?"}${auth}`, init);
  const body = await res.text();
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${body.slice(0, 300)}`);
  return JSON.parse(body) as T;
}

type Named = { id: number; name: string };

const project = await api<Named>(`/projects/${projectKey}`);
const issueTypes = await api<Named[]>(`/projects/${projectKey}/issueTypes`);
const priorities = await api<Named[]>("/priorities");
const issueType = issueTypes.find((t) => t.name === "要望") ?? issueTypes[0];
const priority = priorities.find((p) => p.name === "中") ?? priorities[0];

const issue = await api<{ issueKey: string }>("/issues", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    projectId: String(project.id),
    summary,
    description,
    issueTypeId: String(issueType.id),
    priorityId: String(priority.id),
  }),
});

console.log(`起票しました: ${issue.issueKey}（種別: ${issueType.name} ／ 優先度: ${priority.name}）`);
console.log(`https://${env("BACKLOG_DOMAIN")}/view/${issue.issueKey}`);
