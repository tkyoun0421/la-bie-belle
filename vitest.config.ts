import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@tests": fileURLToPath(new URL("./tests", import.meta.url)),
      "@scripts": fileURLToPath(new URL("./scripts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/**/__tests__/**/*.test.{ts,tsx}",
            ".claude/hooks/__tests__/**/*.test.ts",
            "eslint-rules/__tests__/**/*.test.ts",
            "tests/lint/**/*.test.ts",
          ],
          exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/__tests__/**/*.integration.test.ts"],
        },
      },
    ],
  },
});
