import { test, expect, type Page } from "@playwright/test";

async function fillValidInquiry(page: Page) {
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  await page.getByLabel("お問い合わせ種別").selectOption("product");
  await page.getByLabel("お問い合わせ内容").fill("製品の資料をください。");
}

test("入力画面のボタンは「入力内容を確認する」で、押すと確認画面が表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "送信する" })).toHaveCount(0);
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  await expect(page.getByRole("heading", { name: "お問い合わせ内容の確認" })).toBeVisible();
  await expect(page.getByTestId("confirm-list")).toBeVisible();
  await expect(page.getByLabel("お名前")).toHaveCount(0);
});

test("確認画面に、お名前・メールアドレス・種別の表示名・内容が表示される", async ({ page }) => {
  await page.goto("/");
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  const list = page.getByTestId("confirm-list");
  await expect(list.locator("dt")).toHaveText(["お名前", "メールアドレス", "お問い合わせ種別", "お問い合わせ内容"]);
  await expect(list.locator("dd")).toHaveText(["山田 太郎", "taro@example.com", "製品について", "製品の資料をください。"]);
});

test("確認画面で「送信する」を押すと送信され、受付完了のメッセージが表示される", async ({ page }) => {
  await page.goto("/");
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("done-message")).toBeVisible();

  // 管理画面の一覧に届いている
  await page.goto("/#/admin");
  await expect(page.getByRole("cell", { name: "山田 太郎" })).toBeVisible();
});

test("確認画面で「修正する」を押すと入力画面に戻り、入力内容が残っている", async ({ page }) => {
  await page.goto("/");
  await fillValidInquiry(page);
  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  await page.getByRole("button", { name: "修正する" }).click();
  await expect(page.getByLabel("お名前")).toHaveValue("山田 太郎");
  await expect(page.getByLabel("メールアドレス")).toHaveValue("taro@example.com");
  await expect(page.getByLabel("お問い合わせ種別")).toHaveValue("product");
  await expect(page.getByLabel("お問い合わせ内容")).toHaveValue("製品の資料をください。");
});

test("入力に誤りがあると、確認画面から送信した後にエラーになる", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example");
  await page.getByRole("button", { name: "入力内容を確認する" }).click();
  await expect(page.getByTestId("error-message")).toHaveCount(0);
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("error-message")).toHaveText("送信に失敗しました。入力内容をご確認ください。");
  await expect(page.getByLabel("メールアドレス")).toHaveValue("taro@example");
});
