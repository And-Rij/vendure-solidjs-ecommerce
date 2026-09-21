import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,

  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  reporter: "list",
  outputDir: "test-results",

  use: {
    baseURL: "http://localhost:3002",
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "node --env-file=.env .output/server/index.mjs",
    url: "http://localhost:3002/products/polonyna-trek",
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      NITRO_PORT: "3002",
    },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
