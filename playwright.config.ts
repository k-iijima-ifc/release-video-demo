import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "app/tests",
  reporter: [["list"], ["json", { outputFile: "out/test-results.json" }]],
  use: {
    baseURL: "http://localhost:5173",
    locale: "ja-JP",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
