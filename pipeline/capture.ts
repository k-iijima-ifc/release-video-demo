// Playwright で変更前（マージ直前）と変更後（マージ後）の画面を撮影する
import { chromium, type Page } from "@playwright/test";
import { build, preview } from "vite";
import { run } from "./lib/exec";
import { paths, readJson, saveAsset, updateManifest, type PipelineContext, type Sources } from "./lib/context";

/**
 * 撮影する操作。改善前後の違いが出るよう、誤りのある入力のまま送信する。
 * 題材の画面が変わったらここを変える
 */
async function scenario(page: Page): Promise<void> {
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example");
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "送信する" }).click();
  await page.waitForTimeout(1000);
}

async function captureApp(): Promise<Buffer> {
  await build({ logLevel: "warn" });
  const server = await preview({ logLevel: "warn", preview: { port: 4173, strictPort: true } });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, locale: "ja-JP" });
    await page.goto("http://localhost:4173/");
    await scenario(page);
    return await page.locator("main").screenshot();
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  }
}

export async function capture(ctx: PipelineContext): Promise<void> {
  const sources = readJson<Sources>(paths(ctx).sources);
  if (run("git", ["status", "--porcelain", "app"]).trim()) {
    throw new Error("app/ に未コミットの変更があります。変更前の画面を撮るために app/ を一時的に入れ替えるため、先にコミットしてください");
  }

  // 変更後：いまのチェックアウト（マージ後）
  const after = await captureApp();

  // 変更前：app/ だけマージ直前の状態に戻して撮り、終わったら元に戻す
  let before: Buffer;
  run("git", ["checkout", sources.pr.baseCommit, "--", "app"]);
  try {
    before = await captureApp();
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
