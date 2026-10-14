import { test, expect } from "@playwright/test";

const red = "rgb(220, 38, 38)";
const yellow = "rgb(250, 204, 21)";
const green = "rgb(22, 163, 74)";
const lightRed = "rgb(254, 226, 226)";

test("対応状況が色付きのラベルで表示される（未対応＝赤、対応中＝黄、完了＝緑）", async ({ page }) => {
  await page.goto("/#/admin");
  const label = (name: string) => page.locator("tbody tr", { hasText: name }).locator(".status-label");

  await expect(label("中村 健")).toHaveText("未対応");
  await expect(label("中村 健")).toHaveCSS("background-color", red);
  await expect(label("山本 花子")).toHaveText("対応中");
  await expect(label("山本 花子")).toHaveCSS("background-color", yellow);
  await expect(label("田中 一郎")).toHaveText("完了");
  await expect(label("田中 一郎")).toHaveCSS("background-color", green);
});

test("一覧の上に、対応状況ごとの件数が表示される", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(page.getByTestId("status-count-未対応")).toHaveText("未対応3件");
  await expect(page.getByTestId("status-count-対応中")).toHaveText("対応中3件");
  await expect(page.getByTestId("status-count-完了")).toHaveText("完了2件");

  // 件数は一覧（表）より上にある
  const summaryBox = await page.getByTestId("status-count-未対応").boundingBox();
  const tableBox = await page.locator("table.data-table").boundingBox();
  expect(summaryBox!.y).toBeLessThan(tableBox!.y);
});

test("対応状況を変えると、件数が変わる", async ({ page }) => {
  await page.goto("/#/admin");
  await page.getByRole("link", { name: /請求書の宛名/ }).click();
  await expect(page.getByRole("heading", { name: "問い合わせ No.1003" })).toBeVisible();
  await page.getByLabel("対応状況").selectOption("完了");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByTestId("saved-message")).toBeVisible();

  await page.getByRole("link", { name: "← 一覧に戻る" }).click();
  await expect(page.getByTestId("status-count-未対応")).toHaveText("未対応2件");
  await expect(page.getByTestId("status-count-対応中")).toHaveText("対応中3件");
  await expect(page.getByTestId("status-count-完了")).toHaveText("完了3件");
});

test("担当者が決まっていない未対応の問い合わせは、行の背景が薄い赤になる", async ({ page }) => {
  await page.goto("/#/admin");
  const cell = (name: string) => page.locator("tbody tr", { hasText: name }).locator("td").first();

  // 未対応・未割当
  await expect(cell("中村 健")).toHaveCSS("background-color", lightRed);
  await expect(cell("加藤 大輔")).toHaveCSS("background-color", lightRed);
  await expect(cell("山田 翔")).toHaveCSS("background-color", lightRed);
  // 対応中・完了の行は目立たせない
  await expect(cell("山本 花子")).not.toHaveCSS("background-color", lightRed);
  await expect(cell("田中 一郎")).not.toHaveCSS("background-color", lightRed);
});

test("未対応でも担当者が決まった問い合わせは、行の背景が薄い赤にならない", async ({ page }) => {
  await page.goto("/#/admin");
  await page.getByRole("link", { name: /請求書の宛名/ }).click();
  await expect(page.getByRole("heading", { name: "問い合わせ No.1003" })).toBeVisible();
  await page.getByLabel("担当者").selectOption("高橋");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByTestId("saved-message")).toBeVisible();

  await page.getByRole("link", { name: "← 一覧に戻る" }).click();
  const row = page.locator("tbody tr", { hasText: "中村 健" });
  await expect(row.locator(".status-label")).toHaveText("未対応");
  await expect(row.locator("td").first()).not.toHaveCSS("background-color", lightRed);
});

test("並び順はこれまでどおり受付日時の新しい順になっている", async ({ page }) => {
  await page.goto("/#/admin");
  const ids = page.locator("tbody tr td:first-child");
  await expect(ids).toHaveText(["1008", "1007", "1006", "1005", "1004", "1003", "1002", "1001"]);
});
