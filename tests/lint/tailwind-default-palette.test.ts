import { describe, expect, it } from "vitest";
import { violationsOf } from "@tests/lint/rule-check";

const NO_DEFAULT_PALETTE_CLASS = "house/no-default-palette-class";

async function ruleIdsOfClassName(className: string) {
  const code = `export function Fixture() {\n  return <div className="${className}" />;\n}\n`;
  const violations = await violationsOf(code, "src/shared/ui/fixture.tsx");
  return violations.map((violation) => violation.ruleId);
}

describe("규칙5 — Tailwind 기본 팔레트 유틸리티", () => {
  it("text-warning-500은 우리 팔레트 이름이라 house/no-default-palette-class가 안 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("text-warning-500");

    expect(ruleIds).not.toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("bg-neutral-500은 우리 팔레트 이름이라 house/no-default-palette-class가 안 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("bg-neutral-500");

    expect(ruleIds).not.toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("bg-red-500은 우리 팔레트에 없어 house/no-default-palette-class가 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("bg-red-500");

    expect(ruleIds).toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("text-gray-600은 우리 팔레트에 없어 house/no-default-palette-class가 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("text-gray-600");

    expect(ruleIds).toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("bg-slate-100은 우리 팔레트에 없어 house/no-default-palette-class가 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("bg-slate-100");

    expect(ruleIds).toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("bg-red-500/[0.5]는 대괄호 투명도를 써도 house/no-default-palette-class가 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("bg-red-500/[0.5]");

    expect(ruleIds).toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("text-gray-600/[.25]는 대괄호 투명도를 써도 house/no-default-palette-class가 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("text-gray-600/[.25]");

    expect(ruleIds).toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("bg-white/[0.9]는 무채색이고 대괄호 투명도를 써도 house/no-default-palette-class가 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("bg-white/[0.9]");

    expect(ruleIds).toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("bg-primary/80은 우리 역할 토큰이라 house/no-default-palette-class가 안 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("bg-primary/80");

    expect(ruleIds).not.toContain(NO_DEFAULT_PALETTE_CLASS);
  });

  it("ring-ring/50은 우리 역할 토큰이라 house/no-default-palette-class가 안 걸린다", async () => {
    const ruleIds = await ruleIdsOfClassName("ring-ring/50");

    expect(ruleIds).not.toContain(NO_DEFAULT_PALETTE_CLASS);
  });
});
