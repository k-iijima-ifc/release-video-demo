// script.json と素材から out/<課題キー>/props.json を作り、Remotion で動画を書き出す
import { existsSync } from "node:fs";
import { join } from "node:path";
import { run } from "./lib/exec";
import { paths, readJson, readManifest, writeJson, type PipelineContext } from "./lib/context";
import type { ReleaseScript, ReleaseVideoProps } from "../video/src/types";

/** 全動画で共通の効果音（prepare-assets で作成） */
const SFX = { opening: "sfx/opening.mp3", success: "sfx/success.mp3" };

export async function render(ctx: PipelineContext): Promise<void> {
  const script = readJson<ReleaseScript>(paths(ctx).script);
  const assets = readManifest(ctx);
  const sfx = Object.fromEntries(Object.entries(SFX).filter(([, p]) => existsSync(join(ctx.publicDir, p))));
  const props: ReleaseVideoProps = { script, assets: { ...assets, sfx } };
  writeJson(paths(ctx).props, props);

  run("npx", ["remotion", "render", "video/src/index.ts", "ReleaseVideo", paths(ctx).video, `--props=${paths(ctx).props}`], {
    stdio: "inherit",
  });
  console.log(`  ${paths(ctx).video}`);
}
