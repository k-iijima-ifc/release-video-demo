import type { PipelineContext } from "./lib/context";

// Backlog に動画を添付してコメントし、状態を完了にする。PRにもコメントする（フェーズ4で実装）
export async function deliver(_ctx: PipelineContext): Promise<void> {
  console.warn("  deliver は未実装のためスキップします（計画書のフェーズ4で実装）");
}
