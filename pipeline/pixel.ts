// PixelLab で機能アイコンを作る（案内役キャラは prepare-assets で事前に作って固定）
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pixflux } from "./lib/pixellab";
import { paths, readJson, saveAsset, updateManifest, type PipelineContext } from "./lib/context";
import type { ReleaseScript } from "../video/src/types";

const CHARACTER = "character.png";

export async function generatePixelArt(ctx: PipelineContext): Promise<void> {
  const script = readJson<ReleaseScript>(paths(ctx).script);
  const summary = script.scenes.find((s) => s.id === "summary");
  if (summary?.icon) {
    const png = await pixflux(`${summary.icon}, simple game item icon, bold outline, centered`, { width: 128, height: 128 });
    const icon = saveAsset(ctx, "icon.png", png);
    updateManifest(ctx, (m) => {
      m.scenes.summary = { ...m.scenes.summary, icon };
    });
    console.log(`  アイコン: ${summary.icon}`);
  }
  if (existsSync(join(ctx.publicDir, CHARACTER))) {
    updateManifest(ctx, (m) => {
      m.character = CHARACTER;
    });
  } else {
    console.warn(`  assets/${CHARACTER} がないため、案内役キャラなしで作ります（prepare-assets で作成）`);
  }
}
