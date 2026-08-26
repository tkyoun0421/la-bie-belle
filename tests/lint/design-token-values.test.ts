import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { errorsOf, violationsOf } from "@tests/lint/rule-check";

const NO_ARBITRARY_CLASS_VALUES = "house/no-arbitrary-class-values";
const NO_COLOR_LITERALS = "house/no-color-literals";
const DESIGN_TOKEN_RULES = [NO_ARBITRARY_CLASS_VALUES, NO_COLOR_LITERALS];

function designTokenRuleIds(ruleIds: string[]) {
  return ruleIds.filter((ruleId) => DESIGN_TOKEN_RULES.includes(ruleId));
}

async function ruleIdsOfClassName(className: string) {
  const code = `export function Fixture() {\n  return <div className="${className}" />;\n}\n`;
  const violations = await violationsOf(code, "src/shared/ui/fixture.tsx");
  return violations.map((violation) => violation.ruleId);
}

describe("규칙4 — 하드코딩한 색과 크기", () => {
  describe("대괄호 안이 토큰을 거치면 통과한다", () => {
    it.each([
      ["[&_svg]:pointer-events-none", "선택자 변형"],
      ["[&_svg:not([class*='size-'])]:size-4", "not 선택자 안 크기 클래스"],
      ["in-data-[slot=button-group]:rounded-lg", "속성 선택자 변형"],
      ["*:[img:first-child]:rounded-t-xl", "자식 선택자 변형"],
      [
        "data-[size=sm]:[--card-spacing:--spacing(3)]",
        "data 변형 안 커스텀 프로퍼티",
      ],
      ["[--card-spacing:--spacing(3)]", "커스텀 프로퍼티에 스페이싱 함수"],
      ["has-data-[icon=inline-end]:pr-2", "has-data 변형"],
      ["active:not-aria-[haspopup]:translate-y-px", "not-aria 변형"],
      ["supports-[display:grid]:grid", "supports 변형"],
      [
        "bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        "var()를 감싼 color-mix",
      ],
      ["grid-cols-[1fr_auto]", "그리드 트랙 크기"],
      ["grid-rows-[auto_auto]", "그리드 트랙 크기"],
    ])("%s (%s)는 규칙4의 어느 규칙도 안 걸린다", async (className) => {
      const ruleIds = await ruleIdsOfClassName(
        `flex ${className} items-center`,
      );

      expect(designTokenRuleIds(ruleIds)).toEqual([]);
    });
  });

  describe("대괄호 안이 리터럴이면 걸린다", () => {
    it.each([
      ["text-[0.8rem]", "rem 리터럴 크기", [NO_ARBITRARY_CLASS_VALUES]],
      ["text-[13px]", "px 리터럴 크기", [NO_ARBITRARY_CLASS_VALUES]],
      ["p-[7px]", "px 리터럴 스페이싱", [NO_ARBITRARY_CLASS_VALUES]],
      [
        "bg-[#6E4F39]",
        "hex 리터럴 색",
        [NO_ARBITRARY_CLASS_VALUES, NO_COLOR_LITERALS],
      ],
      [
        "bg-[rgb(110,79,57)]",
        "rgb 리터럴 색",
        [NO_ARBITRARY_CLASS_VALUES, NO_COLOR_LITERALS],
      ],
      [
        "bg-[hsl(24,32%,33%)]",
        "hsl 리터럴 색",
        [NO_ARBITRARY_CLASS_VALUES, NO_COLOR_LITERALS],
      ],
    ])(
      "%s (%s)는 적어둔 규칙이 전부 걸린다",
      async (className, _description, expectedRuleIds) => {
        const ruleIds = await ruleIdsOfClassName(
          `flex ${className} items-center`,
        );

        expect(designTokenRuleIds(ruleIds)).toEqual(expectedRuleIds);
      },
    );
  });

  describe("변형 접두사 자리에 박힌 임의 값도 걸린다", () => {
    it.each([
      [
        "max-[600px]:hidden",
        "변형 자리 px 리터럴",
        [NO_ARBITRARY_CLASS_VALUES],
      ],
      [
        "min-[48rem]:grid-cols-2",
        "변형 자리 rem 리터럴",
        [NO_ARBITRARY_CLASS_VALUES],
      ],
    ])(
      "%s (%s)는 마지막 세그먼트가 아니어도 걸린다",
      async (className, _description, expectedRuleIds) => {
        const ruleIds = await ruleIdsOfClassName(
          `flex ${className} items-center`,
        );

        expect(designTokenRuleIds(ruleIds)).toEqual(expectedRuleIds);
      },
    );
  });

  describe("두 번째 이후 대괄호 그룹도 걸린다", () => {
    it("w-[var(--w)]-[13px]의 두 번째 그룹 13px가 걸린다", async () => {
      const ruleIds = await ruleIdsOfClassName(
        "flex w-[var(--w)]-[13px] items-center",
      );

      expect(designTokenRuleIds(ruleIds)).toEqual([NO_ARBITRARY_CLASS_VALUES]);
    });
  });

  describe("토큰 함수를 걷어내고 남는 리터럴은 걸린다", () => {
    it.each([
      [
        "p-[calc(var(--gap)+13px)]",
        "calc 안에 남는 px",
        [NO_ARBITRARY_CLASS_VALUES],
      ],
      [
        "w-[calc(var(--w)-2rem)]",
        "calc 안에 남는 rem",
        [NO_ARBITRARY_CLASS_VALUES],
      ],
      [
        "rounded-[min(var(--radius-md),12px)]",
        "min() 안에 남는 px",
        [NO_ARBITRARY_CLASS_VALUES],
      ],
      [
        "bg-[color-mix(in_oklch,var(--primary),#6E4F39_10%)]",
        "color-mix 안에 남는 hex",
        [NO_ARBITRARY_CLASS_VALUES, NO_COLOR_LITERALS],
      ],
    ])(
      "%s (%s)는 var()를 걷어낸 나머지에서 걸린다",
      async (className, _description, expectedRuleIds) => {
        const ruleIds = await ruleIdsOfClassName(
          `flex ${className} items-center`,
        );

        expect(designTokenRuleIds(ruleIds)).toEqual(expectedRuleIds);
      },
    );
  });

  it("회귀 — 실제 button.tsx 파일은 규칙4의 어느 규칙도 안 걸린다", async () => {
    const code = readFileSync(
      path.join(process.cwd(), "src/shared/ui/button.tsx"),
      "utf8",
    );
    const errors = await errorsOf(code, "src/shared/ui/button.tsx");

    expect(errors).toEqual([]);
  });
});
