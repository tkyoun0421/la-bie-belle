import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/hooks-export-use-only";

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

const HOOK_FILE = "src/screens/pending/hooks/useFixture.ts";

describe("house/hooks-export-use-only — controller 폴더는 훅만 내보낸다", () => {
  it("`hooks/`가 `use*`가 아닌 함수를 내보내면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function pressFixture() {\n  return 1;\n}\n`,
      HOOK_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`use*`가 아닌 화살표 상수도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const pressFixture = () => 1;\n`,
      HOOK_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("값 상수도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(`export const FIXTURE = 1;\n`, HOOK_FILE);

    expect(ruleIds).toContain(RULE_ID);
  });

  it("클래스도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(`export class Fixture {}\n`, HOOK_FILE);

    expect(ruleIds).toContain(RULE_ID);
  });

  it("따로 적은 `export { fixture }`도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `function fixture() {\n  return 1;\n}\n\nexport { fixture };\n`,
      HOOK_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("이름을 바꿔 `use*`가 아니게 내보내도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `function useInner() {\n  return 1;\n}\n\nexport { useInner as fixture };\n`,
      HOOK_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("재수출로 흘려보내도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export { fixture } from "@/screens/pending/model/fixture.policy";\n`,
      HOOK_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`use` 뒤가 소문자인 이름은 훅이 아니라 걸린다", async () => {
    const ruleIds = await ruleIdsOf(`export const user = true;\n`, HOOK_FILE);

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`features/`와 `shared/`의 `hooks/`도 같은 길이 막힌다", async () => {
    const featureIds = await ruleIdsOf(
      `export const pressFixture = () => 1;\n`,
      "src/features/auth/hooks/useFixture.ts",
    );
    const sharedIds = await ruleIdsOf(
      `export const pressFixture = () => 1;\n`,
      "src/shared/hooks/useFixture.ts",
    );

    expect(featureIds).toContain(RULE_ID);
    expect(sharedIds).toContain(RULE_ID);
  });

  it("`use*` 함수와 상수는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function useFixture() {\n  return 1;\n}\n\nexport const useOther = () => 2;\n`,
      HOOK_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입과 인터페이스 export는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureState = { open: boolean };\n\nexport interface FixtureProps {\n  id: string;\n}\n\nexport function useFixture() {\n  return 1;\n}\n`,
      HOOK_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`export type { }`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `type FixtureState = { open: boolean };\n\nexport type { FixtureState };\n`,
      HOOK_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("내보내지 않는 보조 함수는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `function helper() {\n  return 1;\n}\n\nexport function useFixture() {\n  return helper();\n}\n`,
      HOOK_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`model/`의 `use*`가 아닌 export는 대상이 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function pressFixture() {\n  return 1;\n}\n`,
      "src/screens/pending/model/pressFixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`services/`와 `utils/`도 대상이 아니다", async () => {
    const serviceIds = await ruleIdsOf(
      `export const pressFixture = () => 1;\n`,
      "src/entities/profile/services/useFixtureQuery.ts",
    );
    const utilsIds = await ruleIdsOf(
      `export const pressFixture = () => 1;\n`,
      "src/entities/profile/utils/fixture.utils.ts",
    );

    expect(serviceIds).not.toContain(RULE_ID);
    expect(utilsIds).not.toContain(RULE_ID);
  });
});
