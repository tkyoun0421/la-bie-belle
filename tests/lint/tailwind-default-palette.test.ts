import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintClassName(className: string) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  const code = `export function Fixture() {\n  return <div className="${className}" />;\n}\n`;
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), "src/shared/ui/fixture.tsx"),
  });
  return result;
}

describe("규칙5 — Tailwind 기본 팔레트 유틸리티", () => {
  it("text-warning-500은 우리 팔레트 이름이라 통과한다", async () => {
    const result = await lintClassName("text-warning-500");

    expect(result.errorCount).toBe(0);
  });

  it("bg-neutral-500은 우리 팔레트 이름이라 통과한다", async () => {
    const result = await lintClassName("bg-neutral-500");

    expect(result.errorCount).toBe(0);
  });

  it("bg-red-500은 우리 팔레트에 없어 걸린다", async () => {
    const result = await lintClassName("bg-red-500");

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("text-gray-600은 우리 팔레트에 없어 걸린다", async () => {
    const result = await lintClassName("text-gray-600");

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("bg-slate-100은 우리 팔레트에 없어 걸린다", async () => {
    const result = await lintClassName("bg-slate-100");

    expect(result.errorCount).toBeGreaterThan(0);
  });
});
