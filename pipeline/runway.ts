import { notImplemented, type PipelineContext } from "./lib/context";

// Runway でオープニング映像を作る。失敗したら assets/opening.mp4（キャッシュ）を使う
export async function generateOpening(_ctx: PipelineContext): Promise<void> {
  notImplemented("runway", "フェーズ2");
}
