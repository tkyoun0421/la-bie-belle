import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["tools/**/*.test.mjs", "src/**/*.test.{ts,tsx}"],
          exclude: [
            "**/node_modules/**",
            "src/**/ui/**/*.test.{ts,tsx}",
            "src/**/hooks/**/*.test.{ts,tsx}",
          ],
        },
      },
      {
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/ui/**/*.test.{ts,tsx}", "src/**/hooks/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/setup-dom.ts"],
        },
      },
    ],
  },
});
