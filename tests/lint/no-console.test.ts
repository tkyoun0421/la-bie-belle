import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lintFixture(code: string, filePath: string) {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), filePath),
  });
  return result;
}

describe("규칙13 — console", () => {
  it("console.log는 걸린다", async () => {
    const code = `export function f() {\n  console.log("x");\n}\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("console.error는 위반 0건이다", async () => {
    const code = `export function f() {\n  console.error("x");\n}\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("console.warn은 위반 0건이다", async () => {
    const code = `export function f() {\n  console.warn("x");\n}\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBe(0);
  });

  it("console.info도 걸린다", async () => {
    const code = `export function f() {\n  console.info("x");\n}\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("console.debug도 걸린다", async () => {
    const code = `export function f() {\n  console.debug("x");\n}\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("console.table도 걸린다", async () => {
    const code = `export function f() {\n  console.table(["x"]);\n}\n`;

    const result = await lintFixture(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(result.errorCount).toBeGreaterThan(0);
  });

  it("회귀 — 지금 src/에는 console 호출이 없어 위반 0건이다", async () => {
    const code = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

    const result = await lintFixture(code, "src/shared/lib/utils.ts");

    expect(result.errorCount).toBe(0);
  });
});
