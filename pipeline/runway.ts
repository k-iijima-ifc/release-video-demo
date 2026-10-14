// オープニング映像を用意する。prepare-assets で作った assets/opening.mp4 を使い、
// RUNWAY_FRESH=true のときだけ毎回新しく生成する（失敗したら事前生成分に戻す）
import { existsSync } from "node:fs";
import { join } from "node:path";
import { generateOpeningVideo } from "./lib/runway";
import { saveAsset, updateManifest, type PipelineContext } from "./lib/context";

const CACHED = "opening.mp4";

export async function generateOpening(ctx: PipelineContext): Promise<void> {
  const cached = existsSync(join(ctx.publicDir, CACHED)) ? CACHED : undefined;
  let openingVideo = cached;

  if (process.env.RUNWAY_FRESH === "true" || !cached) {
    try {
      openingVideo = saveAsset(ctx, "opening.mp4", (await generateOpeningVideo()).video);
    } catch (e) {
      if (!cached) throw e;
      console.warn(`  Runway の生成に失敗したため、事前生成の映像を使います: ${e instanceof Error ? e.message : e}`);
    }
  }
  updateManifest(ctx, (m) => {
    m.openingVideo = openingVideo;
  });
  console.log(`  オープニング映像: ${openingVideo}`);
}
