// 各サービスの残高と最近の使用量を表示する（クレジットは消費しない）
import RunwayML from "@runwayml/sdk";
import { env } from "./lib/env";

async function getJson(url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 16).replace("T", " ");

async function elevenLabs() {
  const headers = { "xi-api-key": env("ELEVENLABS_API_KEY") };
  try {
    const sub = await getJson("https://api.elevenlabs.io/v1/user/subscription", headers);
    console.log(`ElevenLabs: プラン ${sub.tier}、今月の使用 ${sub.character_count} / ${sub.character_limit} クレジット（リセット ${day(sub.next_character_count_reset_unix)}）`);
  } catch (e) {
    console.log(`ElevenLabs: 契約情報は取得できません（APIキーに user_read の権限がない）${e instanceof Error ? "" : e}`);
  }
  const history = await getJson("https://api.elevenlabs.io/v1/history?page_size=100", headers);
  for (const h of history.history ?? []) {
    const cost = (h.character_count_change_to ?? 0) - (h.character_count_change_from ?? 0);
    console.log(`  ${day(h.date_unix)} ${h.model_id ?? h.source ?? "-"} ${cost} クレジット（${(h.text ?? "").length} 文字）${(h.text ?? "").slice(0, 20)}`);
  }
}

async function runway() {
  const client = new RunwayML({ apiKey: env("RUNWAYML_API_SECRET") });
  const org = await client.organization.retrieve();
  console.log(`Runway: 残高 ${org.creditBalance} クレジット`);
  const usage = await client.organization.retrieveUsage({});
  for (const r of usage.results) {
    console.log(`  ${r.date} ${r.usedCredits.map((u) => `${u.model}=${u.amount}`).join("、")}`);
  }
}

async function pixelLab() {
  const balance = await getJson("https://api.pixellab.ai/v2/balance", { Authorization: `Bearer ${env("PIXELLAB_API_KEY")}` });
  console.log(`PixelLab: ${JSON.stringify(balance)}`);
}

for (const [name, fn] of Object.entries({ elevenLabs, runway, pixelLab })) {
  try {
    await fn();
  } catch (e) {
    console.log(`${name}: 取得できませんでした ${e instanceof Error ? e.message : e}`);
  }
}
