import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-snake-case-field";

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

const OUTSIDE = "src/screens/stats/utils/fixture.utils.ts";

describe("house/no-snake-case-field — DB 열 이름은 api를 안 떠난다", () => {
  it("`api/` 밖의 타입이 snake_case 필드를 선언하면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type Fixture = { work_date: string };\n",
      OUTSIDE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("camelCase 필드는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type Fixture = { workDate: string };\n",
      OUTSIDE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`api/` 안은 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type Fixture = { work_date: string };\n",
      "src/entities/schedule/api/getFixture.api.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입 선언만 본다 — 객체 리터럴의 키는 안 본다", async () => {
    const ruleIds = await ruleIdsOf(
      'export const fixture = { work_date: "2026-10-09" };\n',
      OUTSIDE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("DB가 든 값을 키로 쓰는 표는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      'const of: Record<string, string> = { signup_approved: "가입이 승인됐어요" };\n\nexport const fixture = of;\n',
      "src/entities/notification/utils/title.utils.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("생성물인 `databaseTypes.ts`는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type Fixture = { work_date: string };\n",
      "src/shared/api/databaseTypes.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`.tsx`도 본다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type FixtureProps = { work_date: string };\n",
      "src/screens/stats/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("대문자 스네이크인 상수 이름은 이 규칙이 안 본다", async () => {
    const ruleIds = await ruleIdsOf("export const MAX_COUNT = 1;\n", OUTSIDE);

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("밑줄이 둘이어도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type Fixture = { a_b_c: number };\n",
      OUTSIDE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`src/app/`의 라우트는 밖이다 — URL이 이름을 정한다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type FixtureParams = { access_token?: string };\n",
      "src/app/__test/fixture.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("매퍼는 밖이다 — 꼴을 바꾸는 유일한 자리다", async () => {
    const ruleIds = await ruleIdsOf(
      "export type Fixture = { work_date: string };\n",
      "src/entities/schedule/utils/schedule.mapper.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("글자로 적은 키는 못 본다 — 계산식 키가 이 규칙의 구멍이다", async () => {
    const ruleIds = await ruleIdsOf(
      'export type Fixture = { ["work_date"]: string };\n',
      OUTSIDE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리를 든다", async () => {
    const violations = await violationsOf(
      "export type Fixture = { work_date: string };\n",
      OUTSIDE,
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/mapper/);
  });
});
