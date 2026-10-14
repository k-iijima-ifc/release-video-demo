import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ReleaseVideoProps } from "../../video/src/types";

/**
 * パイプラインの各ステップが受け渡す情報。
 * ステップ間のデータはすべて out/<課題キー>/ のファイル経由でやり取りし、
 * 一部のステップだけを再実行できるようにする
 */
export type PipelineContext = {
  issueKey: string;
  /** 作業用の出力先（out/<課題キー>） */
  outDir: string;
  /** Remotion の public ディレクトリ（assets/） */
  publicDir: string;
  /** 生成した素材の置き場所（assets/generated/<課題キー>） */
  assetsDir: string;
};

export type TestCaseResult = { title: string; ok: boolean };

/** collect が集めた材料（out/<課題キー>/sources.json） */
export type Sources = {
  issueKey: string;
  issue: { summary: string; description: string; url: string };
  pr: { number: number; title: string; body: string; url: string; mergeCommit: string; baseCommit: string };
  diff: string;
  tests: TestCaseResult[];
};

/** 生成した素材の一覧（out/<課題キー>/manifest.json）。パスは public ディレクトリからの相対パス */
export type Manifest = ReleaseVideoProps["assets"];

export const paths = (ctx: PipelineContext) => ({
  sources: join(ctx.outDir, "sources.json"),
  script: join(ctx.outDir, "script.json"),
  manifest: join(ctx.outDir, "manifest.json"),
  props: join(ctx.outDir, "props.json"),
  testResults: join(ctx.outDir, "test-results.json"),
  video: join(ctx.outDir, "release.mp4"),
});

export function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`${path} がありません。前のステップを先に実行してください`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

export function readManifest(ctx: PipelineContext): Manifest {
  const path = paths(ctx).manifest;
  return existsSync(path) ? readJson<Manifest>(path) : { scenes: {} };
}

export function updateManifest(ctx: PipelineContext, update: (m: Manifest) => void): void {
  const manifest = readManifest(ctx);
  update(manifest);
  writeJson(paths(ctx).manifest, manifest);
}

/** 生成した素材を public ディレクトリに保存し、public からの相対パス（staticFile 用）を返す */
export function saveAsset(ctx: PipelineContext, fileName: string, data: Buffer): string {
  const fullPath = join(ctx.assetsDir, fileName);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, data);
  return toPublicPath(ctx.publicDir, fullPath);
}

export function toPublicPath(publicDir: string, fullPath: string): string {
  return fullPath.slice(publicDir.length + 1).replaceAll("\\", "/");
}
