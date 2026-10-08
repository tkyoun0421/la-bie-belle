import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/pure-policy";

const POLICY_FILE = "src/entities/fixture/model/fixture.policy.ts";
const REDUCER_FILE = "src/entities/fixture/model/fixture.reducer.ts";

function judging(body: string) {
  return `export function judge() {\n  return ${body};\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/pure-policy", () => {
  it("`.policy.ts`가 `api` 세그먼트에서 값을 당기면 걸린다", async () => {
    const code = `import { fixtureClient } from "@/shared/api/fixtureClient";\n\n${judging("fixtureClient.ready")}`;

    expect(await ruleIdsOf(code, POLICY_FILE)).toContain(RULE_ID);
  });

  it("`.reducer.ts`도 `api` 세그먼트에서 값을 당기면 걸린다", async () => {
    const code = `import { fixtureClient } from "@/shared/api/fixtureClient";\n\nexport function reduce(state: number) {\n  return fixtureClient.ready ? state + 1 : state;\n}\n`;

    expect(await ruleIdsOf(code, REDUCER_FILE)).toContain(RULE_ID);
  });

  it("`api` 세그먼트를 타입으로만 당기는 것은 통과한다", async () => {
    const code = `import type { FixtureRow } from "@/shared/api/fixture.dto";\n\nexport function judge(row: FixtureRow) {\n  return row.ok;\n}\n`;

    expect(await ruleIdsOf(code, POLICY_FILE)).not.toContain(RULE_ID);
  });

  it("인라인 타입 지정자만 든 import도 통과한다", async () => {
    const code = `import { type FixtureRow } from "@/shared/api/fixture.dto";\n\nexport function judge(row: FixtureRow) {\n  return row.ok;\n}\n`;

    expect(await ruleIdsOf(code, POLICY_FILE)).not.toContain(RULE_ID);
  });

  it("타입과 값을 섞어 당기면 걸린다", async () => {
    const code = `import { fixtureClient, type FixtureRow } from "@/shared/api/fixture.dto";\n\nexport function judge(row: FixtureRow) {\n  return fixtureClient.ready && row.ok;\n}\n`;

    expect(await ruleIdsOf(code, POLICY_FILE)).toContain(RULE_ID);
  });

  it("`api` 세그먼트를 재수출하는 것도 걸린다", async () => {
    const code = `export { fixtureClient } from "@/shared/api/fixtureClient";\n`;

    expect(await ruleIdsOf(code, POLICY_FILE)).toContain(RULE_ID);
  });

  it("`api` 세그먼트를 타입으로 재수출하는 것은 통과한다", async () => {
    const code = `export type { FixtureRow } from "@/shared/api/fixture.dto";\n`;

    expect(await ruleIdsOf(code, POLICY_FILE)).not.toContain(RULE_ID);
  });

  it("`api`가 아닌 세그먼트에서 값을 당기는 것은 통과한다", async () => {
    const code = `import { FIXTURE_LIMIT } from "@/shared/consts/fixture";\n\n${judging("FIXTURE_LIMIT > 0")}`;

    expect(await ruleIdsOf(code, POLICY_FILE)).not.toContain(RULE_ID);
  });

  it("`Date.now()`를 쓰면 걸린다", async () => {
    expect(await ruleIdsOf(judging("Date.now() > 0"), POLICY_FILE)).toContain(
      RULE_ID,
    );
  });

  it("인자 없는 `new Date()`를 쓰면 걸린다", async () => {
    expect(
      await ruleIdsOf(judging("new Date().getTime() > 0"), POLICY_FILE),
    ).toContain(RULE_ID);
  });

  it("인자 없는 `Date.parse()`를 쓰면 걸린다", async () => {
    expect(await ruleIdsOf(judging("Date.parse() > 0"), POLICY_FILE)).toContain(
      RULE_ID,
    );
  });

  it("`Math.random()`을 쓰면 걸린다", async () => {
    expect(
      await ruleIdsOf(judging("Math.random() > 0.5"), POLICY_FILE),
    ).toContain(RULE_ID);
  });

  it("`.reducer.ts`의 시계 읽기도 걸린다", async () => {
    const code = `export function reduce(state: number) {\n  return state + Date.now();\n}\n`;

    expect(await ruleIdsOf(code, REDUCER_FILE)).toContain(RULE_ID);
  });

  it("인자를 받는 `new Date(...)`는 통과한다", async () => {
    expect(
      await ruleIdsOf(
        judging('new Date("2026-10-05").getTime() > 0'),
        POLICY_FILE,
      ),
    ).not.toContain(RULE_ID);
  });

  it("인자를 받는 `Date.parse(...)`는 통과한다", async () => {
    expect(
      await ruleIdsOf(judging('Date.parse("2026-10-05") > 0'), POLICY_FILE),
    ).not.toContain(RULE_ID);
  });

  it("「지금」을 인자로 받는 판정은 통과한다", async () => {
    const code = `export function judge(serverNowMs: number, expiresAtMs: number) {\n  return serverNowMs >= expiresAtMs;\n}\n`;

    expect(await ruleIdsOf(code, POLICY_FILE)).not.toContain(RULE_ID);
  });

  it("접미사가 없는 `model` 파일은 규칙 밖이다", async () => {
    expect(
      await ruleIdsOf(
        judging("Date.now() > 0"),
        "src/entities/fixture/model/fixture.ts",
      ),
    ).not.toContain(RULE_ID);
  });

  it("`.utils.ts`는 규칙 밖이다", async () => {
    expect(
      await ruleIdsOf(
        judging("Math.random() > 0.5"),
        "src/entities/fixture/utils/fixture.utils.ts",
      ),
    ).not.toContain(RULE_ID);
  });

  it("시계 메시지가 「인자로 받아라」와 읽은 이름을 든다", async () => {
    const violations = await violationsOf(
      judging("Date.now() > 0"),
      POLICY_FILE,
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/Date\.now\(\)/);
    expect(message).toMatch(/인자로 받아라/);
  });

  it("통신 메시지가 `.dto.ts`로 갈 자리를 가리킨다", async () => {
    const code = `import { fixtureClient } from "@/shared/api/fixtureClient";\n\n${judging("fixtureClient.ready")}`;
    const violations = await violationsOf(code, POLICY_FILE);
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/\.dto\.ts/);
    expect(message).toMatch(/@\/shared\/api\/fixtureClient/);
  });
});
