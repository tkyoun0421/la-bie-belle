import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/entities-read-only";

function hookCall(hook: string) {
  return `import { ${hook} } from "@tanstack/react-query";\n\nexport function useFixture() {\n  return ${hook}({ mutationFn: async () => undefined });\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

describe("house/entities-read-only — entities는 읽기만 든다", () => {
  it("`entities`의 service가 쓰기 훅을 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      hookCall("useMutation"),
      "src/entities/profile/services/useFixtureMutation.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`entities`의 다른 세그먼트도 같이 본다", async () => {
    const ruleIds = await ruleIdsOf(
      hookCall("useMutation"),
      "src/entities/profile/hooks/useFixture.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`features`의 service는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      hookCall("useMutation"),
      "src/features/profileEdit/services/useFixtureMutation.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`entities`가 읽기 훅을 당기는 것은 통과한다", async () => {
    const code = `import { useQuery } from "@tanstack/react-query";\n\nexport function useFixture() {\n  return useQuery({ queryKey: ["x"], queryFn: async () => 1 });\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/services/useFixtureQuery.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("이름을 바꿔 받아도 걸린다", async () => {
    const code = `import { useMutation as useSend } from "@tanstack/react-query";\n\nexport function useFixture() {\n  return useSend({ mutationFn: async () => undefined });\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/services/useFixtureMutation.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("네임스페이스로 받아 부르는 것도 걸린다", async () => {
    const code = `import * as query from "@tanstack/react-query";\n\nexport function useFixture() {\n  return query.useMutation({ mutationFn: async () => undefined });\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/services/useFixtureMutation.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("같은 이름이 다른 패키지에서 오면 안 본다", async () => {
    const code = `import { useMutation } from "@fixture/elsewhere";\n\nexport function useFixture() {\n  return useMutation();\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/profile/services/useFixtureMutation.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리를 든다", async () => {
    const violations = await violationsOf(
      hookCall("useMutation"),
      "src/entities/profile/services/useFixtureMutation.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/features\//);
  });
});
