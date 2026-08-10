import { defineConfig, devices } from "@playwright/test";

import { STORAGE_STATE_PATH } from "./tests/e2e/global-setup";
import { resolveSuperAdminFixtureEmail } from "./tests/e2e/support/super-admin-fixture";

const PORT = 3100;
const SUPER_ADMIN_EMAIL = resolveSuperAdminFixtureEmail();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    storageState: STORAGE_STATE_PATH,
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 5"] } }],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env, SUPER_ADMIN_EMAIL },
  },
});
