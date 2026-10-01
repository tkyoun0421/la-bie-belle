import { violationsOf } from "@tests/lint/rule-check";

const NO_VISUAL_UTILITY_CLASS = "house/no-visual-utility-class";
const EXEMPT_MESSAGE = "색·글자·모양은 `src/shared/ui`의 조각이 든다";

async function ruleIdsOfClassName(className: string, filePath: string) {
  const code = `export function Fixture() {\n  return <div className="${className}" />;\n}\n`;
  const violations = await violationsOf(code, filePath);
  return violations.map((violation) => violation.ruleId);
}

async function violationsOfClassName(className: string, filePath: string) {
  const code = `export function Fixture() {\n  return <div className="${className}" />;\n}\n`;
  return violationsOf(code, filePath);
}

describe("규칙19 — 화면 파일의 시각 유틸리티 (AC-03)", () => {
  it.each([
    "bg-bg-neutral",
    "text-lg",
    "font-medium",
    "rounded-xl",
    "shadow-card",
    "border-stroke-neutral",
  ])("src/screens/**의 %s를 막는다", async (className) => {
    const ruleIds = await ruleIdsOfClassName(
      className,
      "src/screens/pending/ui/Pending.tsx",
    );

    expect(ruleIds).toContain(NO_VISUAL_UTILITY_CLASS);
  });

  it.each([
    "bg-bg-neutral",
    "text-sm",
    "font-semibold",
    "rounded-lg",
    "shadow-card",
    "border-stroke-neutral",
  ])("src/features/**의 %s를 막는다", async (className) => {
    const ruleIds = await ruleIdsOfClassName(
      className,
      "src/features/attendance/ui/Card.tsx",
    );

    expect(ruleIds).toContain(NO_VISUAL_UTILITY_CLASS);
  });

  it.each([
    "flex",
    "gap-2",
    "p-5",
    "m-2",
    "w-full",
    "h-11",
    "items-center",
    "justify-center",
  ])("배치 유틸리티 %s는 막지 않는다", async (className) => {
    const ruleIds = await ruleIdsOfClassName(
      className,
      "src/screens/pending/ui/Pending.tsx",
    );

    expect(ruleIds).not.toContain(NO_VISUAL_UTILITY_CLASS);
  });

  it("src/shared/ui/**는 규칙 밖이다", async () => {
    const ruleIds = await ruleIdsOfClassName(
      "bg-bg-neutral",
      "src/shared/ui/Card.tsx",
    );

    expect(ruleIds).not.toContain(NO_VISUAL_UTILITY_CLASS);
  });

  it("src/app/_catalog.tsx는 규칙 밖이다", async () => {
    const ruleIds = await ruleIdsOfClassName(
      "bg-bg-neutral",
      "src/app/_catalog.tsx",
    );

    expect(ruleIds).not.toContain(NO_VISUAL_UTILITY_CLASS);
  });

  it("메시지가 조각을 가져다 쓰라고만 말하고 특정 조각을 지목하지 않는다", async () => {
    const violations = await violationsOfClassName(
      "bg-bg-neutral",
      "src/screens/pending/ui/Pending.tsx",
    );
    const target = violations.find(
      (violation) => violation.ruleId === NO_VISUAL_UTILITY_CLASS,
    );

    expect(target?.message).toContain(EXEMPT_MESSAGE);
  });
});
