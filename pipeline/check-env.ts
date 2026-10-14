// 各APIに読み取り専用のリクエストを1回ずつ送り、キーと設定が正しいか確かめる。
// クレジットを消費する生成系のAPIは呼ばない。
import { env, optionalEnv } from "./lib/env";

type Check = { name: string; run: () => Promise<string> };

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, { headers });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
  return JSON.parse(body);
}

const checks: Check[] = [
  {
    name: "Claude (Anthropic)",
    run: async () => {
      const apiKey = optionalEnv("ANTHROPIC_API_KEY");
      if (!apiKey) {
        if (optionalEnv("CLAUDE_CODE_OAUTH_TOKEN")) return "CLAUDE_CODE_OAUTH_TOKEN あり（疎通は claude -p で確認）";
        env("ANTHROPIC_API_KEY");
      }
      const data = await getJson("https://api.anthropic.com/v1/models?limit=1", {
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
      });
      return `OK（モデル一覧を取得: ${data.data?.[0]?.id ?? "-"}）`;
    },
  },
  {
    name: "Backlog",
    run: async () => {
      const base = `https://${env("BACKLOG_DOMAIN")}/api/v2`;
      const key = `apiKey=${encodeURIComponent(env("BACKLOG_API_KEY"))}`;
      const projectKey = env("BACKLOG_PROJECT_KEY");
      const user = await getJson(`${base}/users/myself?${key}`);
      const project = await getJson(`${base}/projects/${projectKey}?${key}`);
      const statuses: { id: number; name: string }[] = await getJson(`${base}/projects/${projectKey}/statuses?${key}`);
      const doneId = Number(optionalEnv("BACKLOG_DONE_STATUS_ID") ?? 4);
      const done = statuses.find((s) => s.id === doneId);
      if (!done) throw new Error(`状態ID ${doneId} がありません。候補: ${statuses.map((s) => `${s.id}=${s.name}`).join(", ")}`);
      return `OK（ユーザー: ${user.name} ／ プロジェクト: ${project.name} ／ 完了状態: ${done.id}=${done.name}）`;
    },
  },
  {
    name: "ElevenLabs",
    run: async () => {
      const headers = { "xi-api-key": env("ELEVENLABS_API_KEY") };
      const voiceId = optionalEnv("ELEVENLABS_VOICE_ID");
      if (!voiceId) {
        const voices = await getJson("https://api.elevenlabs.io/v2/voices?page_size=5", headers);
        const names = voices.voices?.map((v: any) => `${v.name}(${v.voice_id})`).join(", ");
        return `OK（ELEVENLABS_VOICE_ID 未設定。声の例: ${names}）`;
      }
      const voice = await getJson(`https://api.elevenlabs.io/v1/voices/${voiceId}`, headers);
      return `OK（声: ${voice.name}）`;
    },
  },
  {
    name: "PixelLab",
    run: async () => {
      const data = await getJson("https://api.pixellab.ai/v2/balance", {
        Authorization: `Bearer ${env("PIXELLAB_API_KEY")}`,
      });
      return `OK（残高: ${JSON.stringify(data).slice(0, 120)}）`;
    },
  },
  {
    name: "Runway",
    run: async () => {
      const data = await getJson("https://api.dev.runwayml.com/v1/organization", {
        Authorization: `Bearer ${env("RUNWAYML_API_SECRET")}`,
        "X-Runway-Version": "2024-11-06",
      });
      return `OK（クレジット残高: ${data.creditBalance ?? "-"}）`;
    },
  },
];

let failed = 0;
for (const check of checks) {
  try {
    console.log(`✔ ${check.name}: ${await check.run()}`);
  } catch (e) {
    failed++;
    console.log(`✘ ${check.name}: ${e instanceof Error ? e.message : e}`);
  }
}
console.log(failed === 0 ? "\nすべて疎通できました。" : `\n${failed} 件失敗しました。`);
process.exit(failed === 0 ? 0 : 1);
