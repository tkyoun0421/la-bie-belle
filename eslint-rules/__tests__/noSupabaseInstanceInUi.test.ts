import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-supabase-instance-in-ui";

function instanceImport() {
  return `import { supabase } from "@/shared/api/supabase";\n\nexport function Fixture() {\n  return supabase;\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/no-supabase-instance-in-ui", () => {
  it("`screens/*/ui`가 손잡이를 쥐면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      instanceImport(),
      "src/screens/pending/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`shared/ui`가 손잡이를 쥐면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      instanceImport(),
      "src/shared/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`features/*/ui`가 손잡이를 쥐면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      instanceImport(),
      "src/features/profileEdit/ui/Fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("재수출로 돌아가도 걸린다", async () => {
    const code = `export { supabase } from "@/shared/api/supabase";\n`;

    const ruleIds = await ruleIdsOf(code, "src/shared/ui/Fixture.tsx");

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`hooks/`가 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      instanceImport(),
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/app/`은 세그먼트가 없어 통과한다", async () => {
    const ruleIds = await ruleIdsOf(instanceImport(), "src/app/fixture.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`ui`가 타입만 당기는 것은 이 규칙이 안 본다", async () => {
    const code = `import type { Database } from "@/shared/api/database";\n\nexport function Fixture(_db: Database) {\n  return null;\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/shared/ui/Fixture.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 controller를 갈 자리로 가리킨다", async () => {
    const violations = await violationsOf(
      instanceImport(),
      "src/screens/pending/ui/Fixture.tsx",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/hooks\//);
  });
});
