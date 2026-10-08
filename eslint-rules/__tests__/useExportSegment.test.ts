import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/use-export-segment";

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/use-export-segment", () => {
  it("`model/`이 `export function useX`를 내면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useFixture() {\n  return 1;\n}\n`,
      "src/screens/pending/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`utils/`의 `export const useX`도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const useFixture = () => 1;\n`,
      "src/entities/profile/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("따로 적은 `export { useX }`도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `function useFixture() {\n  return 1;\n}\n\nexport { useFixture };\n`,
      "src/shared/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("이름을 바꿔 내보내도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `function fixture() {\n  return 1;\n}\n\nexport { fixture as useFixture };\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("재수출로 흘려보내도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export { useFixture } from "@/shared/stores/fixture.store";\n`,
      "src/screens/pending/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("세그먼트 없이 슬라이스 루트에 사는 훅도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useFixture() {\n  return 1;\n}\n`,
      "src/entities/profile/fixture.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`lib/`의 훅도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useFixture() {\n  return 1;\n}\n`,
      "src/features/auth/lib/fixture.lib.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`useId`처럼 짧은 이름도 훅이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useId() {\n  return "1";\n}\n`,
      "src/entities/profile/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`hooks/`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useFixture() {\n  return 1;\n}\n`,
      "src/screens/pending/hooks/useFixture.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`services/`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const useFixtureQuery = () => 1;\n`,
      "src/entities/profile/services/useFixtureQuery.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`use*`로 불리는 store가 `stores/`에 사는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const useTheme = () => 1;\n`,
      "src/shared/stores/theme.store.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/app/`은 세그먼트가 없어 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useFixture() {\n  return 1;\n}\n`,
      "src/app/_layout.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입만 내보내는 것은 대상이 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      `type useFixture = () => void;\n\nexport type { useFixture };\n`,
      "src/entities/profile/model/fixture.type.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it.each(["used", "user", "useful"])(
    "`use` 뒤가 소문자인 %s는 훅이 아니다",
    async (name) => {
      const ruleIds = await ruleIdsOf(
        `export const ${name} = true;\n`,
        "src/entities/profile/model/fixture.policy.ts",
      );

      expect(ruleIds).not.toContain(RULE_ID);
    },
  );

  it("규칙 메시지가 갈 자리 셋과 걸린 이름을 든다", async () => {
    const violations = await violationsOf(
      `export function useFixture() {\n  return 1;\n}\n`,
      "src/screens/pending/model/fixture.policy.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/hooks/);
    expect(message).toMatch(/services/);
    expect(message).toMatch(/stores/);
    expect(message).toMatch(/useFixture/);
  });
});
