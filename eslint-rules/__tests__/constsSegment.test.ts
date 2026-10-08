import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/consts-segment";

function settledValue(name: string) {
  return `export const ${name} = 30;\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

describe("house/consts-segment — 정해진 값이 사는 자리를 consts로 묶는다", () => {
  it("`model/`이 대문자 스네이크를 내보내면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      settledValue("LATE_THRESHOLD_MINUTES"),
      "src/entities/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`utils/`도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      settledValue("DISCARD_ID"),
      "src/screens/fixture/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("낱말 하나짜리 대문자 이름도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      settledValue("SCHEME"),
      "src/features/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("한 선언에 둘을 적으면 둘 다 걸린다", async () => {
    const code = `export const FIRST_VALUE = 1,\n  SECOND_VALUE = 2;\n`;

    const violations = await violationsOf(
      code,
      "src/entities/fixture/model/fixture.policy.ts",
    );
    const mine = violations.filter((violation) => violation.ruleId === RULE_ID);

    expect(mine).toHaveLength(2);
  });

  it("재수출이 같은 값을 다른 자리에 세워도 걸린다", async () => {
    const code = `export { POSITION_ORDER } from "@/entities/fixture/consts/fixture.const";\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/fixture/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("들여온 것을 그대로 다시 내보내는 것도 걸린다", async () => {
    const code = `import { POSITION_ORDER } from "@/entities/fixture/consts/fixture.const";\n\nexport { POSITION_ORDER };\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("이름을 바꿔 내보내면 바뀐 이름으로 본다", async () => {
    const code = `import { positionOrder } from "@/entities/fixture/consts/fixture.const";\n\nexport { positionOrder as POSITION_ORDER };\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("export를 안 한 로컬 const는 대상이 아니다", async () => {
    const code = `const COPY = { title: "제목" };\n\nexport function titleOf() {\n  return COPY.title;\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("camel로 내보내는 통신의 약속은 꼴이 달라 안 걸린다", async () => {
    const code = `export const queryKeys = { fixture: ["fixture"] as const };\n\nexport const staleTogether = 30_000;\n`;

    const ruleIds = await ruleIdsOf(code, "src/shared/api/queryKeys.ts");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입만 다시 내보내는 것은 값이 아니라 통과한다", async () => {
    const code = `export type { FIXTURE_SHAPE } from "@/entities/fixture/model/fixture.type";\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`consts/`가 들고 있는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      settledValue("LATE_THRESHOLD_MINUTES"),
      "src/entities/fixture/consts/fixture.const.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`api/`의 질의할 열 목록은 질의의 일부라 통과한다", async () => {
    const code = `export const FIXTURE_COLUMNS = "id, created_at";\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/fixture/api/getFixture.api.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`lib/`의 SDK 손 묶음은 값이 아니라 통과한다", async () => {
    const code = `export const FIXTURE_DEPS = { ask: async () => true };\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixture/lib/fixtureDeps.lib.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`__tests__/`의 픽스처는 통과한다", async () => {
    const code = `export const DAYS = ["2026-01-01"];\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixture/model/__tests__/fixtures.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`.tsx`의 테스트 손잡이는 이 규칙이 안 본다", async () => {
    const code = `export const FIXTURE_TEST_ID = "fixture";\n\nexport function Fixture() {\n  return <div testID={FIXTURE_TEST_ID} />;\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/screens/fixture/ui/Fixture.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("조각을 든 표는 `.ts`인 `consts/`가 못 들어 `.tsx`에 남는다", async () => {
    const code = `function Mark() {\n  return <div />;\n}\n\nexport const VIEW_OPTIONS = [{ value: "day", icon: Mark }];\n`;

    const ruleIds = await ruleIdsOf(code, "src/screens/fixture/ui/Fixture.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/` 밖은 세그먼트가 없어 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      settledValue("FIXTURE_LIMIT"),
      "tests/lint/fixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리와 걸린 이름을 든다", async () => {
    const violations = await violationsOf(
      settledValue("LATE_THRESHOLD_MINUTES"),
      "src/entities/fixture/model/fixture.policy.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/consts\//);
    expect(message).toMatch(/LATE_THRESHOLD_MINUTES/);
  });
});
