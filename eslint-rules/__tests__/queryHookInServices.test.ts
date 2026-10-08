import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/query-hook-in-services";

function namedImport(clause: string) {
  return `import { ${clause} } from "@tanstack/react-query";\n\nexport function useFixture() {\n  return { clause: "${clause}" };\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/query-hook-in-services", () => {
  it("`hooks/`가 `useQuery`를 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      namedImport("useQuery"),
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`model/`이 `useMutation`을 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      namedImport("useMutation"),
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("이름을 바꿔 받아도 같은 훅이라 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      namedImport("useQuery as useFixtureQuery"),
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("네임스페이스로 받아 부르는 것도 걸린다", async () => {
    const code = `import * as reactQuery from "@tanstack/react-query";\n\nexport function useFixture() {\n  return reactQuery.useMutation({ mutationFn: async () => undefined });\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`services/`에서 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      namedImport("useQuery"),
      "src/entities/profile/services/useFixtureQuery.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`services/`의 네임스페이스도 통과한다", async () => {
    const code = `import * as reactQuery from "@tanstack/react-query";\n\nexport function useFixtureMutation() {\n  return reactQuery.useMutation({ mutationFn: async () => undefined });\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/profileEdit/services/useFixtureMutation.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`useQueryClient`는 통신을 열지 않아 어느 자리에서도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      namedImport("useQueryClient"),
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리와 걸린 훅 이름을 든다", async () => {
    const violations = await violationsOf(
      namedImport("useQuery"),
      "src/screens/pending/hooks/useFixture.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/services\//);
    expect(message).toMatch(/useQuery/);
  });
});
