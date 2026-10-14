import type { ReleaseScript, ReleaseVideoProps } from "../../video/src/types";

/** パイプラインの各ステップが受け渡す情報 */
export type PipelineContext = {
  issueKey: string;
  /** 作業用の出力先（out/<課題キー>） */
  outDir: string;
  /** 生成した素材の置き場所（Remotion の public ディレクトリ配下） */
  assetsDir: string;
  /** collect が集めた材料（PR差分、課題本文、テスト結果） */
  sources?: { issue: unknown; diff: string; prBody: string; testResults?: unknown };
  script?: ReleaseScript;
  props?: ReleaseVideoProps;
  videoPath?: string;
};

export function notImplemented(step: string, phase: string): never {
  throw new Error(`${step} は未実装です（計画書の${phase}で実装）`);
}
