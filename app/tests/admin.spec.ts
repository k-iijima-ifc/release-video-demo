import { test, expect } from "@playwright/test";

test("問い合わせ一覧に、受付日時の新しい順で問い合わせが表示される", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(page.getByRole("heading", { name: "問い合わせ一覧" })).toBeVisible();
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(8);
  await expect(rows.first()).toContainText("佐々木 優");
  await expect(rows.last()).toContainText("田中 一郎");
});

test("フォームから送信した問い合わせが、一覧の先頭に未対応で表示される", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  await page.getByLabel("お問い合わせ種別").selectOption("product");
  await page.getByLabel("お問い合わせ内容").fill("製品の資料をください。");
  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("done-message")).toBeVisible();

  await page.getByRole("link", { name: "問い合わせ管理" }).click();
  const first = page.locator("tbody tr").first();
  await expect(first).toContainText("山田 太郎");
  await expect(first).toContainText("未対応");
  await expect(first).toContainText("未割当");
});

test("詳細画面で対応状況・担当者・メモを変更して保存できる", async ({ page }) => {
  await page.goto("/#/admin");
  await page.getByRole("link", { name: /請求書の宛名/ }).click();
  await expect(page.getByRole("heading", { name: "問い合わせ No.1003" })).toBeVisible();

  await page.getByLabel("対応状況").selectOption("対応中");
  await page.getByLabel("担当者").selectOption("高橋");
  await page.getByLabel("対応メモ").fill("経理部に手続き方法を確認する。");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByTestId("saved-message")).toBeVisible();

  await page.getByRole("link", { name: "← 一覧に戻る" }).click();
  const row = page.locator("tbody tr", { hasText: "中村 健" });
  await expect(row).toContainText("対応中");
  await expect(row).toContainText("高橋");
});
