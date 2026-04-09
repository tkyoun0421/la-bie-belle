import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "#": path.resolve(__dirname, "src")
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/shared/tests/setup/vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
});
