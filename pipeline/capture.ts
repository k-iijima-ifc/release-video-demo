// Playwright で変更前（マージ直前）と変更後（マージ後）の画面を撮影する
import { chromium, type Page } from "@playwright/test";
import { build, preview } from "vite";
import { run } from "./lib/exec";
import { paths, readJson, saveAsset, updateManifest, type PipelineContext, type Sources } from "./lib/context";
import type { CaptureStep, ReleaseScript } from "../video/src/types";

/** 台本に撮影手順がないときの操作（入力チェックの改善向け） */
const DEFAULT_STEPS: CaptureStep[] = [
  { action: "fill", label: "お名前", value: "山田 太郎" },
  { action: "fill", label: "メールアドレス", value: "taro@example" },
  { action: "press", key: "Tab" },
  { action: "click", text: "送信する" },
  { action: "wait", ms: 1000 },
];

const BASE_URL = "http://localhost:4173";
/** 変更前の画面にない要素を待ち続けないよう、1操作の待ち時間を短くする */
const STEP_TIMEOUT = 2000;

async function runStep(page: Page, step: CaptureStep): Promise<void> {
  switch (step.action) {
    case "goto":
      await page.goto(`${BASE_URL}${step.path.startsWith("#") ? `/${step.path}` : step.path}`);
      return;
    case "fill":
      return page.getByLabel(step.label).fill(step.value.repeat(step.repeat ?? 1), { timeout: STEP_TIMEOUT });
    case "select": {
      const select = page.getByLabel(step.label);
      // value でも表示名でも指定できるようにする
      await select.selectOption(step.value, { timeout: STEP_TIMEOUT }).catch(() => select.selectOption({ label: step.value }, { timeout: STEP_TIMEOUT }));
      return;
    }
    case "click": {
      // ボタン → リンク → 文字の順に探す
      const target = page
        .getByRole("button", { name: step.text })
        .or(page.getByRole("link", { name: step.text }))
        .or(page.getByText(step.text, { exact: true }))
        .first();
      return target.click({ timeout: STEP_TIMEOUT });
    }
    case "press":
      return page.keyboard.press(step.key);
    case "wait":
      return page.waitForTimeout(step.ms);
  }
}

async function scenario(page: Page, steps: CaptureStep[], label: string): Promise<void> {
  for (const step of steps) {
    try {
      await runStep(page, step);
    } catch {
      console.log(`  ${label}: 実行できない操作をスキップ ${JSON.stringify(step)}`);
    }
  }
}

async function captureApp(steps: CaptureStep[], label: string): Promise<Buffer> {
  await build({ logLevel: "warn" });
  const server = await preview({ logLevel: "warn", preview: { port: 4173, strictPort: true } });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, locale: "ja-JP" });
    await page.goto(`${BASE_URL}/`);
    await scenario(page, steps, label);
    return await page.locator("main").screenshot();
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  }
}

export async function capture(ctx: PipelineContext): Promise<void> {
  const sources = readJson<Sources>(paths(ctx).sources);
  const script = readJson<ReleaseScript>(paths(ctx).script);
  const steps = script.capture?.length ? script.capture : DEFAULT_STEPS;
  console.log(`  撮影手順: ${steps.map((s) => s.action).join(" → ")}`);
  if (run("git", ["status", "--porcelain", "app"]).trim()) {
    throw new Error("app/ に未コミットの変更があります。変更前の画面を撮るために app/ を一時的に入れ替えるため、先にコミットしてください");
  }

  // 変更後：いまのチェックアウト（マージ後）
  const after = await captureApp(steps, "変更後");

  // 変更前：app/ だけマージ直前の状態に戻して撮り、終わったら元に戻す
  let before: Buffer;
  run("git", ["checkout", sources.pr.baseCommit, "--", "app"]);
  try {
    before = await captureApp(steps, "変更前");
  } finally {
    run("git", ["checkout", "HEAD", "--", "app"]);
    run("git", ["clean", "-fdq", "app"]);
  }

  updateManifest(ctx, (m) => {
    m.scenes.before_after = {
      ...m.scenes.before_after,
      beforeImage: saveAsset(ctx, "before.png", before),
      afterImage: saveAsset(ctx, "after.png", after),
    };
  });
  console.log("  変更前と変更後の画面を撮影しました");
}
