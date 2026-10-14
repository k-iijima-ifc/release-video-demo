// 使い方: npm run pipeline -- DEMO-1 [ステップ名...]
// ステップ名を省略するとすべて実行する。ローカルのリハーサルと Actions で同じものを使う
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import "./lib/env";
import type { PipelineContext } from "./lib/context";
import { collect } from "./collect";
import { generateScript } from "./script";
import { capture } from "./capture";
import { generateVoice } from "./voice";
import { generatePixelArt } from "./pixel";
import { generateOpening } from "./runway";
import { render } from "./render";
import { deliver } from "./deliver";

const steps: Record<string, (ctx: PipelineContext) => Promise<void>> = {
  collect,
  script: generateScript,
  capture,
  voice: generateVoice,
  pixel: generatePixelArt,
  runway: generateOpening,
  render,
  deliver,
};

const [issueKey, ...only] = process.argv.slice(2);
if (!issueKey || !/^[A-Z][A-Z0-9_]*-\d+$/.test(issueKey)) {
  console.error("課題キーを指定してください（例: npm run pipeline -- DEMO-1）");
  process.exit(1);
}

const ctx: PipelineContext = {
  issueKey,
  outDir: join("out", issueKey),
  assetsDir: join("assets", "generated", issueKey),
};
mkdirSync(ctx.outDir, { recursive: true });
mkdirSync(ctx.assetsDir, { recursive: true });

for (const [name, step] of Object.entries(steps)) {
  if (only.length > 0 && !only.includes(name)) continue;
  console.log(`▶ ${name}`);
  await step(ctx);
}
console.log("完了");
