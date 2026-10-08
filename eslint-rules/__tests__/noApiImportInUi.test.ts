import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-api-import-in-ui";

function importFrom(specifier: string) {
  return `import { read } from "${specifier}";\n\nexport function Fixture() {\n  return read();\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/no-api-import-in-ui", () => {
  it("`screens/*/ui`가 `api`를 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/api/getProfile.api"),
      "src/screens/pending/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`shared/ui`가 `api`를 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/shared/api/queryKeys"),
      "src/shared/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`features/*/ui`도 `api`는 못 당긴다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/api/getProfile.api"),
      "src/features/profileEdit/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`hooks`가 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/api/getProfile.api"),
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`ui`가 `model`을 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/model/profile.policy"),
      "src/screens/pending/ui/Fixture.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
