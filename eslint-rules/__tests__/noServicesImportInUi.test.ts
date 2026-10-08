import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-services-import-in-ui";

function importFrom(specifier: string) {
  return `import { useFixtureQuery } from "${specifier}";\n\nexport function Fixture() {\n  return useFixtureQuery();\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/no-services-import-in-ui", () => {
  it("`screens/*/ui`가 service를 부르면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/services/useMyProfileQuery"),
      "src/screens/pending/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`shared/ui`가 service를 부르면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/services/useMyProfileQuery"),
      "src/shared/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`entities/*/ui`가 service를 부르면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/services/useMyProfileQuery"),
      "src/entities/profile/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`features/*/ui`는 자기 슬라이스의 service를 부른다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/features/profileEdit/services/useSubmitProfileMutation"),
      "src/features/profileEdit/ui/Fixture.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`features/*/ui`가 남의 슬라이스 service를 부르면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/features/auth/services/useSignOutMutation"),
      "src/features/profileEdit/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`features/*/ui`가 아래층 service를 부르면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      importFrom("@/entities/profile/services/useMyProfileQuery"),
      "src/features/profileEdit/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });
});
