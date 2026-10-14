import RunwayML from "@runwayml/sdk";
import { env } from "./env";

const OPENING_IMAGE_PROMPT =
  "Cinematic wide shot of a calm modern Japanese office at dawn, soft golden light through large windows, " +
  "a glowing holographic dashboard floating above a desk showing abstract charts and check marks, " +
  "shallow depth of field, clean, hopeful, no text, no logos, no people";

const OPENING_VIDEO_PROMPT =
  "Slow cinematic dolly-in toward the glowing holographic dashboard, light particles drifting, " +
  "the check marks on the dashboard gently light up one by one, smooth camera motion";

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Runway の出力を取得できません: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** オープニング映像を作る（キービジュアルを画像生成 → 5秒の映像にする） */
export async function generateOpeningVideo(): Promise<{ image: Buffer; video: Buffer }> {
  const client = new RunwayML({ apiKey: env("RUNWAYML_API_SECRET") });

  console.log("  Runway: キービジュアルを生成中…");
  const image = await client.textToImage
    .create({ model: "gen4_image", promptText: OPENING_IMAGE_PROMPT, ratio: "1920:1080" })
    .waitForTaskOutput();
  const imageUrl = image.output[0];

  console.log("  Runway: 映像を生成中…（1〜3分）");
  const video = await client.imageToVideo
    .create({ model: "gen4_turbo", promptImage: imageUrl, promptText: OPENING_VIDEO_PROMPT, ratio: "1280:720", duration: 5 })
    .waitForTaskOutput();

  return { image: await download(imageUrl), video: await download(video.output[0]) };
}
