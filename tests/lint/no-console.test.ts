import { describe, expect, it } from "vitest";
import { errorsOf, violationsOf } from "@tests/lint/rule-check";

const NO_CONSOLE = "no-console";

describe("규칙13 — console", () => {
  it("console.log는 걸린다", async () => {
    const code = `export function f() {\n  console.log("x");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_CONSOLE,
    );
  });

  it("console.error는 no-console이 안 걸린다", async () => {
    const code = `export function f() {\n  console.error("x");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_CONSOLE,
    );
  });

  it("console.warn은 no-console이 안 걸린다", async () => {
    const code = `export function f() {\n  console.warn("x");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      NO_CONSOLE,
    );
  });

  it("console.info도 걸린다", async () => {
    const code = `export function f() {\n  console.info("x");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_CONSOLE,
    );
  });

  it("console.debug도 걸린다", async () => {
    const code = `export function f() {\n  console.debug("x");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_CONSOLE,
    );
  });

  it("console.table도 걸린다", async () => {
    const code = `export function f() {\n  console.table(["x"]);\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/model/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(
      NO_CONSOLE,
    );
  });

  it("회귀 — 지금 src/의 utils.ts는 어느 규칙도 안 걸린다", async () => {
    const code = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

    const errors = await errorsOf(code, "src/shared/lib/utils.ts");

    expect(errors).toEqual([]);
  });
});
