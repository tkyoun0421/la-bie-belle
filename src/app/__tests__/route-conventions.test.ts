import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const srcRoot = resolve(import.meta.dirname, "..", "..");
const selfTestFile = resolve(import.meta.dirname, "route-conventions.test.ts");

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name) && fullPath !== selfTestFile) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("라우트 규약", () => {
  describe("animate-pulse 사용처", () => {
    it("src/ 어디에도 animate-pulse가 없다", () => {
      const usages: { file: string; line: number }[] = [];
      for (const filePath of collectSourceFiles(srcRoot)) {
        const lines = readFileSync(filePath, "utf8").split("\n");
        const relativePath = filePath.replace(`${srcRoot}/`, "src/");
        lines.forEach((lineText, index) => {
          if (lineText.includes("animate-pulse")) {
            usages.push({ file: relativePath, line: index + 1 });
          }
        });
      }
      const report = usages.map((usage) => `${usage.file}:${usage.line}`).join("\n");

      expect(usages, `animate-pulse 사용처:\n${report}`).toEqual([]);
    });
  });

  describe("라우트 규약 파일", () => {
    const protectedRoot = resolve(srcRoot, "app", "(protected)");
    const tabsRoot = resolve(protectedRoot, "(tabs)");

    it.each([
      ["providers.tsx", resolve(protectedRoot, "providers.tsx")],
      ["(tabs)/loading.tsx", resolve(tabsRoot, "loading.tsx")],
      ["(tabs)/error.tsx", resolve(tabsRoot, "error.tsx")],
      ["(tabs)/schedule/loading.tsx", resolve(tabsRoot, "schedule", "loading.tsx")],
      ["(tabs)/schedule/error.tsx", resolve(tabsRoot, "schedule", "error.tsx")],
      ["(tabs)/@sheet/default.tsx", resolve(tabsRoot, "@sheet", "default.tsx")],
    ])("%s가 있다", (_label, filePath) => {
      expect(existsSync(filePath), `${filePath} 없음`).toBe(true);
    });
  });

  describe("skeleton 어법 — 막대는 --color-border rounded-xs, 반짝임 없음", () => {
    const rootLoading = resolve(srcRoot, "app", "loading.tsx");
    const tabsLoading = resolve(srcRoot, "app", "(protected)", "(tabs)", "loading.tsx");
    const scheduleLoading = resolve(
      srcRoot,
      "app",
      "(protected)",
      "(tabs)",
      "schedule",
      "loading.tsx",
    );

    it.each([
      ["src/app/loading.tsx", rootLoading],
      ["src/app/(protected)/(tabs)/loading.tsx", tabsLoading],
      ["src/app/(protected)/(tabs)/schedule/loading.tsx", scheduleLoading],
    ])("%s의 막대가 라운드 34 skeleton 어법을 따른다", (label, filePath) => {
      expect(existsSync(filePath), `${filePath} 없음`).toBe(true);
      const content = readFileSync(filePath, "utf8");

      expect(content, `${label}: --color-border 배경 없음`).toMatch(
        /bg-border\b|bg-\[var\(--color-border\)\]/,
      );
      expect(content, `${label}: radius-xs 토큰 미사용`).toMatch(/rounded-xs\b/);
      expect(content, `${label}: 반짝임(shimmer) 클래스가 남아 있음`).not.toMatch(
        /animate-pulse|shimmer/,
      );
    });
  });

  describe("radius 사다리 회귀 방지 — rounded-[ 임의값 금지", () => {
    it("src/ 어디에도 rounded-[ 임의 radius가 없다", () => {
      const usages: { file: string; line: number }[] = [];
      for (const filePath of collectSourceFiles(srcRoot)) {
        const lines = readFileSync(filePath, "utf8").split("\n");
        const relativePath = filePath.replace(`${srcRoot}/`, "src/");
        lines.forEach((lineText, index) => {
          if (lineText.includes("rounded-[")) {
            usages.push({ file: relativePath, line: index + 1 });
          }
        });
      }
      const report = usages.map((usage) => `${usage.file}:${usage.line}`).join("\n");

      expect(usages, `rounded-[ 임의값 사용처:\n${report}`).toEqual([]);
    });
  });
});
