import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/controller-type-not-generic";

async function ruleIdsOf(
  code: string,
  filePath = "src/entities/fixture/hooks/useFixture.ts",
) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/controller-type-not-generic — Controller 별칭의 제네릭 인스턴스화를 문다", () => {
  it("타입 인자를 받은 FragmentState 인스턴스화가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type WageRowsController = FragmentState<{ rows: string[] }>;\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("타입 인자가 없는 맨 이름 별칭은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type PendingRowsController = MemberWaitRowsController;\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("인라인 union은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "failed" }\n  | { state: "empty" }\n  | { state: "ready"; rows: string[] };\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("인라인 객체 타입은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureSheetController = {\n  values: { note: string };\n  touched: boolean;\n};\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("Controller로 끝나지 않는 별칭의 제네릭 인스턴스화는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type WageRowsState = FragmentState<{ rows: string[] }>;\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
