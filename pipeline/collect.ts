import { notImplemented, type PipelineContext } from "./lib/context";

// PR差分・PR本文・Backlog課題・テスト結果を集めて out/<課題キー>/sources.json に保存する
export async function collect(_ctx: PipelineContext): Promise<void> {
  notImplemented("collect", "フェーズ4");
}
