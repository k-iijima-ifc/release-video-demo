import { test, expect } from "@playwright/test";

test("正しく入力すると送信できる", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  await page.getByLabel("お問い合わせ種別").selectOption("product");
  await page.getByLabel("お問い合わせ内容").fill("製品の資料をください。");
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("done-message")).toBeVisible();
});

test("入力に誤りがあると送信後にエラーになる", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example");
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("error-message")).toBeVisible();
});
