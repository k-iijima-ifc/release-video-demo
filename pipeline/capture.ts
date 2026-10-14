import { notImplemented, type PipelineContext } from "./lib/context";

// Playwright で変更前（main の1つ前）と変更後の画面を撮影する
export async function capture(_ctx: PipelineContext): Promise<void> {
  notImplemented("capture", "フェーズ2");
}
