import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/features-query-composes";

const READ = `import { useQuery } from "@tanstack/react-query";`;

function readsFrom(...specifiers: string[]) {
  const imports = specifiers
    .map((specifier, at) => `import { row${at} } from "${specifier}";`)
    .join("\n");

  return `${READ}\n${imports}\n\nexport function useFixture() {\n  return useQuery({ queryKey: ["x"], queryFn: async () => [${specifiers
    .map((_, at) => `row${at}`)
    .join(", ")}] });\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

const FIXTURE = "src/features/stats/services/useFixtureQuery.ts";

describe("house/features-query-composes — features의 읽기는 맞출 때만 선다", () => {
  it("도메인 둘을 맞추면 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      readsFrom(
        "@/entities/schedule/services/useFixtureQuery",
        "@/entities/attendance/services/useFixtureQuery",
      ),
      FIXTURE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("한 도메인만 읽으면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      readsFrom("@/entities/schedule/services/useFixtureQuery"),
      FIXTURE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("같은 도메인을 여러 세그먼트에서 읽어도 하나로 센다", async () => {
    const ruleIds = await ruleIdsOf(
      readsFrom(
        "@/entities/schedule/services/useFixtureQuery",
        "@/entities/schedule/api/fixture.dto",
        "@/entities/schedule/model/fixture.type",
      ),
      FIXTURE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`entities`를 아예 안 읽고 통신을 열면 걸린다", async () => {
    const code = `${READ}\n\nexport function useFixture() {\n  return useQuery({ queryKey: ["x"], queryFn: async () => 1 });\n}\n`;

    const ruleIds = await ruleIdsOf(code, FIXTURE);

    expect(ruleIds).toContain(RULE_ID);
  });

  it("쓰기 훅은 이 규칙이 안 본다", async () => {
    const code = `import { useMutation } from "@tanstack/react-query";\nimport { send } from "@/entities/schedule/api/fixture.api";\n\nexport function useFixture() {\n  return useMutation({ mutationFn: send });\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/stats/services/useFixtureMutation.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`services` 밖은 이 규칙이 안 본다", async () => {
    const ruleIds = await ruleIdsOf(
      readsFrom("@/entities/schedule/services/useFixtureQuery"),
      "src/features/stats/hooks/useFixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`entities`의 service는 혼자 읽어도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      readsFrom("@/entities/schedule/api/fixture.api"),
      "src/entities/schedule/services/useFixtureQuery.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 맞춘 도메인 수를 든다", async () => {
    const violations = await violationsOf(
      readsFrom("@/entities/schedule/services/useFixtureQuery"),
      FIXTURE,
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/1개/);
  });
});
