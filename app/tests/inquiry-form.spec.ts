import { test, expect, type Page } from "@playwright/test";

const red = "rgb(211, 47, 47)";

async function expectErrorBelow(page: Page, label: string, testId: string, text: string) {
  const error = page.getByTestId(testId);
  await expect(error).toHaveText(text);
  await expect(error).toHaveCSS("color", red);
  // 項目のすぐ下に表示されている
  const field = await page.getByLabel(label).boundingBox();
  const message = await error.boundingBox();
  expect(field && message).toBeTruthy();
  expect(message!.y).toBeGreaterThanOrEqual(field!.y + field!.height);
  expect(message!.y - (field!.y + field!.height)).toBeLessThan(20);
}

test("正しく入力すると送信できる", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  await page.getByLabel("お問い合わせ種別").selectOption("product");
  await page.getByLabel("お問い合わせ内容").fill("製品の資料をください。");
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("done-message")).toBeVisible();
  await expect(page.locator(".field-error")).toHaveCount(0);
});

test("必須項目が空欄のまま次の項目に移ると、その項目のすぐ下に赤字で理由を表示する", async ({ page }) => {
  await page.goto("/");
  const cases = [
    { label: "お名前", testId: "name-error", text: "お名前を入力してください。" },
    { label: "メールアドレス", testId: "email-error", text: "メールアドレスを入力してください。" },
    { label: "お問い合わせ種別", testId: "category-error", text: "お問い合わせ種別を選択してください。" },
    { label: "お問い合わせ内容", testId: "message-error", text: "お問い合わせ内容を入力してください。" },
  ];
  for (const c of cases) {
    await page.getByLabel(c.label).focus();
    await page.keyboard.press("Tab");
    await expectErrorBelow(page, c.label, c.testId, c.text);
  }
});

test("空白だけの入力も空欄として扱う", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("お名前").fill("   ");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("name-error")).toHaveText("お名前を入力してください。");
});

test("メールアドレスの形式が誤っていると、その項目のすぐ下に赤字で理由を表示する", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("メールアドレス").fill("taro@example");
  await page.keyboard.press("Tab");
  await expectErrorBelow(
    page,
    "メールアドレス",
    "email-error",
    "メールアドレスの形式が正しくありません（例：taro@example.com）。",
  );
});

test("入力中はメッセージを出さず、次の項目に移ったときに表示する", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".field-error")).toHaveCount(0);
  await page.getByLabel("メールアドレス").fill("taro@");
  await expect(page.getByTestId("email-error")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("email-error")).toBeVisible();
  // 直すとメッセージが消える
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("email-error")).toHaveCount(0);
});

test("誤りがある間に送信ボタンを押すと、送信せずに誤りのある項目すべてにメッセージを表示する", async ({ page }) => {
  let requested = false;
  page.on("request", (req) => {
    if (req.method() === "POST") requested = true;
  });
  await page.goto("/");
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example");
  await page.getByRole("button", { name: "送信する" }).click();

  await expect(page.getByTestId("email-error")).toHaveText(
    "メールアドレスの形式が正しくありません（例：taro@example.com）。",
  );
  await expect(page.getByTestId("category-error")).toHaveText("お問い合わせ種別を選択してください。");
  await expect(page.getByTestId("message-error")).toHaveText("お問い合わせ内容を入力してください。");
  await expect(page.getByTestId("name-error")).toHaveCount(0);

  // 送信していない（送信中にならず、受付完了も送信失敗も出ない）
  await expect(page.getByRole("button", { name: "送信する" })).toBeEnabled();
  await page.waitForTimeout(600);
  await expect(page.getByTestId("done-message")).toHaveCount(0);
  await expect(page.getByTestId("error-message")).toHaveCount(0);
  expect(requested).toBe(false);
});

test("誤りを直せば送信できる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.locator(".field-error")).toHaveCount(4);
  await page.getByLabel("お名前").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill("taro@example.com");
  await page.getByLabel("お問い合わせ種別").selectOption("estimate");
  await page.getByLabel("お問い合わせ内容").fill("見積もりをお願いします。");
  await expect(page.locator(".field-error")).toHaveCount(0);
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByTestId("done-message")).toBeVisible();
});
