import { env } from "./env";

type PixfluxOptions = { width: number; height: number; noBackground?: boolean; seed?: number };

/** テキストからドット絵を生成する（PNG） */
export async function pixflux(description: string, { width, height, noBackground = true, seed }: PixfluxOptions): Promise<Buffer> {
  const res = await fetch("https://api.pixellab.ai/v2/create-image-pixflux", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("PIXELLAB_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ description, image_size: { width, height }, no_background: noBackground, seed }),
  });
  if (!res.ok) throw new Error(`PixelLab: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { image: { base64: string } };
  return Buffer.from(data.image.base64, "base64");
}
