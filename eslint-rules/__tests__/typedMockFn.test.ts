import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/typed-mock-fn";
const FIXTURE_PATH = "src/entities/schedule/api/__tests__/fixture.test.ts";

async function ruleIdsOf(code: string, filePath = FIXTURE_PATH) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/typed-mock-fn — jest.fn의 타입 인자에 unknown이 있으면 문다", () => {
  it("인자와 반환이 모두 unknown인 서명이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<(...args: unknown[]) => Promise<unknown>>();\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("반환이 unknown인 서명이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<(...args: unknown[]) => unknown>();\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("인자가 없어도 반환이 Promise<unknown>이면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<() => Promise<unknown>>();\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("반환이 실물이어도 인자가 unknown[]이면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<(...args: unknown[]) => Promise<void>>();\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("여러 줄로 쪼갠 타입 인자도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<\n  (...args: unknown[]) => Promise<unknown>\n>();\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("걸린 자리마다 하나씩 보고한다", async () => {
    const ruleIds = await ruleIdsOf(
      `const first = jest.fn<() => unknown>();\nconst second = jest.fn<() => Promise<unknown>>();\n`,
    );

    expect(ruleIds.filter((ruleId) => ruleId === RULE_ID)).toHaveLength(2);
  });

  it("메시지가 실물 서명을 typeof로 박으라고 말한다", async () => {
    const violations = await violationsOf(
      `const read = jest.fn<() => Promise<unknown>>();\n`,
      FIXTURE_PATH,
    );
    const violation = violations.find((found) => found.ruleId === RULE_ID);

    expect(violation?.message).toContain("typeof");
  });

  it("typeof로 실물 서명을 박은 자리는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<typeof getMonthSchedule>();\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입 인자가 없는 jest.fn()은 규칙 밖이다", async () => {
    const ruleIds = await ruleIdsOf(`const read = jest.fn();\n`);

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("unknown이 없는 손 서명은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(`const read = jest.fn<() => void>();\n`);

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("인자와 반환이 실물 타입이면 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `const read = jest.fn<(id: string) => Promise<Profile>>();\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
