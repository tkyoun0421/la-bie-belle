import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/supabase-package-in-api";

function valueImport(specifier: string) {
  return `import { createClient } from "${specifier}";\n\nexport function open() {\n  return createClient("url", "key");\n}\n`;
}

function typeImport(specifier: string) {
  return `import type { User } from "${specifier}";\n\nexport function nameOf(user: User) {\n  return user.id;\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

describe("house/supabase-package-in-api — SDK를 당기는 자리를 api로 묶는다", () => {
  it("`model/`이 패키지를 값으로 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      valueImport("@supabase/supabase-js"),
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`api/`에서 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      valueImport("@supabase/supabase-js"),
      "src/shared/api/fixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("슬라이스의 `api/`에서 당기는 것도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      valueImport("@supabase/supabase-js"),
      "src/entities/profile/api/fixture.api.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`api/`의 짝 테스트도 같은 세그먼트라 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      valueImport("@supabase/supabase-js"),
      "src/entities/profile/api/__tests__/fixture.api.test.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`import type`은 어느 세그먼트에서도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      typeImport("@supabase/supabase-js"),
      "src/features/auth/lib/fixture.lib.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("지정자마다 붙인 `type`도 통과한다", async () => {
    const code = `import { type User } from "@supabase/supabase-js";\n\nexport function nameOf(user: User) {\n  return user.id;\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/auth/lib/fixture.lib.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입과 값을 같이 당기면 걸린다", async () => {
    const code = `import { createClient, type User } from "@supabase/supabase-js";\n\nexport function open(_user: User) {\n  return createClient("url", "key");\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/auth/lib/fixture.lib.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("부작용만 당기는 import도 걸린다", async () => {
    const code = `import "@supabase/supabase-js";\n\nexport const ready = true;\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("재수출로 돌아가도 걸린다", async () => {
    const code = `export { createClient } from "@supabase/supabase-js";\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`src/app/`의 라우트 파일도 예외가 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      valueImport("@supabase/supabase-js"),
      "src/app/fixture.tsx",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`@supabase/` 하위 패키지도 같이 본다", async () => {
    const code = `import { AuthError } from "@supabase/auth-js";\n\nexport function failed() {\n  return new AuthError("x");\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("손잡이를 받는 것은 이 규칙이 안 본다", async () => {
    const code = `import { supabase } from "@/shared/api/supabase";\n\nexport function handle() {\n  return supabase;\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/home/hooks/useFixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리를 든다", async () => {
    const violations = await violationsOf(
      valueImport("@supabase/supabase-js"),
      "src/entities/profile/model/fixture.policy.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/api\//);
  });
});
