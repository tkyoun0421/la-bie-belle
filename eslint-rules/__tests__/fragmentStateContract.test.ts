import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/fragment-state-contract";

async function ruleIdsOf(
  code: string,
  filePath = "src/entities/fixture/hooks/useFixture.ts",
) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/fragment-state-contract — 납작한 상태를 문다", () => {
  it("가지를 안 가른 controller가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController = {\n  state: "pending" | "failed" | "ready";\n  rows: string[];\n};\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("상태를 타입 이름으로 미뤄도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { FixtureState } from "@/entities/fixture/model/fixture.type";\n\nexport type FixtureController = {\n  state: FixtureState;\n  rows: string[];\n};\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("판별 union은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "failed" }\n  | { state: "empty" }\n  | { state: "ready"; rows: string[] };\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("가지가 자기 데이터를 들어도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "empty"; reason: "noMembers" | "noMatch" }\n  | { state: "ready"; rows: string[]; hasMore: boolean };\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});

describe("house/fragment-state-contract — 정본 밖의 상태 이름을 문다", () => {
  it("loading이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "loading" }\n  | { state: "ready"; rows: string[] };\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("rows가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "rows"; rows: string[] };\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("다음 쪽이 있나를 상태로 만들면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "normal"; rows: string[] }\n  | { state: "end"; rows: string[] };\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("쓰는 중은 sending 하나만 통과한다", async () => {
    const sending = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "sending" }\n  | { state: "ready" };\n`,
    );

    const saving = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "saving" }\n  | { state: "ready" };\n`,
    );

    expect(sending).not.toContain(RULE_ID);
    expect(saving).toContain(RULE_ID);
  });
});

describe("house/fragment-state-contract — controller가 아닌 state는 안 문다", () => {
  it("reducer가 드는 상태 덩이는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type AddSheetState = {\n  values: { note: string };\n  touched: boolean;\n};\n\nexport function reduce(state: AddSheetState): AddSheetState {\n  return state;\n}\n`,
      "src/features/fixture/model/addSheetState.reducer.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("policy가 내는 판정 이름은 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type RehearsalDayCellState = "empty" | "has";\n\nexport type RehearsalDayCell = {\n  state: RehearsalDayCellState;\n};\n`,
      "src/screens/fixture/model/rehearsalDayCell.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("컴포넌트 props의 그림 상태는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type ScheduleDayCellState = "off" | "picked" | "assigned";\n\nexport type ScheduleDayCellProps = {\n  state: ScheduleDayCellState;\n};\n`,
      "src/shared/ui/ScheduleDayCell.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("글자가 아닌 상태 덩이를 든 controller는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController = {\n  sending: boolean;\n  failedLine: string | null;\n};\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
