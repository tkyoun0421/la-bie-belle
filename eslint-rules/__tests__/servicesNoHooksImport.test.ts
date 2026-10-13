import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/services-no-hooks-import";

function importFrom(specifier: string) {
  return `import { useFixture } from "${specifier}";\n\nexport const useFixtureQuery = () => useFixture();\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

const SERVICE_FILE = "src/entities/profile/services/useFixtureQuery.ts";

describe("house/services-no-hooks-import — service는 controller를 거꾸로 부르지 않는다", () => {
  it("`services/`가 같은 슬라이스의 `hooks/`를 별칭으로 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/hooks/useFixture"),
      SERVICE_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`shared/hooks/`를 당겨도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/shared/hooks/useFixture"),
      SERVICE_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("상대 경로로 `hooks/`를 당겨도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("../hooks/useFixture"),
      SERVICE_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`shared/services/`도 같은 길이 막힌다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/hooks/useFixture"),
      "src/shared/services/useFixtureQuery.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`services/`가 `api/`를 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/api/getFixture.api"),
      SERVICE_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`services/`가 `model/`을 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/model/fixture.policy"),
      SERVICE_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`hooks/`가 `services/`를 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/services/useFixtureQuery"),
      "src/screens/pending/hooks/usePending.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`hooks/`끼리 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/screens/pending/hooks/useFixture"),
      "src/screens/pending/hooks/usePending.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("이름에 hooks가 든 다른 폴더는 `hooks/`가 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/model/hooksPolicy"),
      SERVICE_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
