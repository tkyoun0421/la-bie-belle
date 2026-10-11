import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/type-guard-name";

async function ruleIdsOf(
  code: string,
  filePath = "src/shared/model/fixture.policy.ts",
) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/type-guard-name — 서술어를 돌려주는 함수가 is로 시작하지 않으면 문다", () => {
  it("is로 시작하지 않는 함수 선언이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function filled(value: unknown): value is string {\n  return typeof value === "string";\n}\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("is로 시작하지 않는 화살표 상수가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const filled = (value: unknown): value is string =>\n  typeof value === "string";\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("is 뒤가 대문자가 아니면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function island(value: unknown): value is string {\n  return typeof value === "string";\n}\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("is로 시작하는 함수 선언은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function isFilled(value: unknown): value is string {\n  return typeof value === "string";\n}\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("가드를 돌려주는 손은 서술어를 돌려주지 않아 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function memberOf<Member extends string>(\n  all: readonly Member[],\n): (value: unknown) => value is Member {\n  const known = new Set<string>(all);\n\n  return (value): value is Member =>\n    typeof value === "string" && known.has(value);\n}\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("이름 없는 가드는 읽을 이름이 없어 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function pick(rows: unknown[]): string[] {\n  return rows.filter((row): row is string => typeof row === "string");\n}\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("서술어를 안 돌려주는 함수는 이름과 무관하게 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function filled(value: unknown): boolean {\n  return typeof value === "string";\n}\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
