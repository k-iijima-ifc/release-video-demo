import { env } from "./env";

const BASE = "https://api.pixellab.ai/v2";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env("PIXELLAB_API_KEY")}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`PixelLab ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type PixfluxOptions = { width: number; height: number; noBackground?: boolean; seed?: number };

/** テキストからドット絵を1枚生成する（PNG） */
export async function pixflux(description: string, { width, height, noBackground = true, seed }: PixfluxOptions): Promise<Buffer> {
  const data = await api<{ image: { base64: string } }>("/create-image-pixflux", {
    method: "POST",
    body: JSON.stringify({ description, image_size: { width, height }, no_background: noBackground, seed }),
  });
  return Buffer.from(data.image.base64, "base64");
}

/** バックグラウンドジョブの完了を待つ */
async function waitForJob(jobId: string, label: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const job = await api<{ status: string; last_response?: unknown }>(`/background-jobs/${jobId}`);
    if (job.status === "completed") return;
    if (job.status === "failed") throw new Error(`PixelLab ${label} が失敗しました: ${JSON.stringify(job.last_response).slice(0, 300)}`);
    await sleep(10_000);
  }
  throw new Error(`PixelLab ${label} が20分以内に終わりませんでした`);
}

/** 正面向きの画像から、4方向を持つ「キャラクター」を作る（アニメーションさせるために必要） */
export async function createCharacter(referencePng: Buffer, description: string): Promise<string> {
  const res = await api<{ background_job_id: string; character_id: string }>("/create-character-v3", {
    method: "POST",
    body: JSON.stringify({
      description,
      reference_image: { type: "base64", base64: referencePng.toString("base64"), format: "png" },
      n_directions: 4,
      view: "side",
      template_id: "mannequin",
    }),
  });
  await waitForJob(res.background_job_id, "キャラクター作成");
  return res.character_id;
}

export type AnimationSpec = { name: string; action: string; direction: "south" | "east" | "west" | "north"; frames: number };

/** キャラクターに動きを付ける（動作の説明から生成する v3 モード） */
export async function animateCharacter(characterId: string, spec: AnimationSpec): Promise<void> {
  const res = await api<{ background_job_ids: string[] }>("/characters/animations", {
    method: "POST",
    body: JSON.stringify({
      character_id: characterId,
      animation_name: spec.name,
      action_description: spec.action,
      mode: "v3",
      frame_count: spec.frames,
      directions: [spec.direction],
    }),
  });
  await Promise.all(res.background_job_ids.map((id) => waitForJob(id, `アニメーション ${spec.name}`)));
}

/** キャラクターと全アニメーションを ZIP で取得する（rotations/、animations/{名前}/{向き}/frame_NNN.png） */
export async function downloadCharacterZip(characterId: string): Promise<Buffer> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${BASE}/characters/${characterId}/zip`, {
      headers: { Authorization: `Bearer ${env("PIXELLAB_API_KEY")}` },
    });
    if (res.status === 423) {
      await sleep(10_000);
      continue;
    }
    if (!res.ok) throw new Error(`PixelLab ZIP: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("PixelLab の ZIP が用意できませんでした");
}
