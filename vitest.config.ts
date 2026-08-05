import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const FSD_LAYERS = ["app", "views", "widgets", "features", "entities", "shared"];

const alias = FSD_LAYERS.map((layer) => ({
  find: `@/${layer}`,
  replacement: resolve(import.meta.dirname, "src", layer),
}));

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
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
        resolve: { alias },
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
