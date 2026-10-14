// デモ用の改善要望をBacklogに起票する。リハーサルのたびに新しい課題を作るときにも使う
import { env } from "./lib/env";

const summary = "問い合わせフォームに入力チェックを追加";

const description = `## 背景
問い合わせフォームで入力に誤りがあると、送信ボタンを押した後に「送信に失敗しました。入力内容をご確認ください。」とだけ表示される。
どこを直せばよいかわからず、問い合わせを諦めてしまうお客様がいる。

## 要望
送信する前に、入力の誤りをその場で知らせてほしい。

## 受け入れ条件
- 必須項目（お名前、メールアドレス、お問い合わせ種別、お問い合わせ内容）が空欄のとき、その項目のすぐ下に赤字で理由を表示する
- メールアドレスの形式が誤っているとき、その項目のすぐ下に赤字で理由を表示する
- メッセージは、項目の入力を終えて次の項目に移ったときに表示する
- 誤りがある間に送信ボタンを押したら、送信せずに、誤りのある項目すべてにメッセージを表示する
- 正しく入力すれば、これまでどおり送信できる`;

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
