import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/type-file-no-runtime";

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

const TYPE_FILE = "src/shared/model/fixture.type.ts";
const DTO_FILE = "src/entities/profile/api/fixture.dto.ts";

describe("house/type-file-no-runtime — 타입 파일은 런타임에 아무것도 안 한다", () => {
  it(".type.ts의 클래스 선언이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export class FixtureError extends Error {}\n`,
      TYPE_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it(".type.ts의 변수 선언이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(`export const FIXTURE = 1;\n`, TYPE_FILE);

    expect(ruleIds).toContain(RULE_ID);
  });

  it(".type.ts의 함수 선언이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function fixture() {\n  return 1;\n}\n`,
      TYPE_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("내보내지 않는 선언도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `const fixture = 1;\n\nexport type Fixture = typeof fixture;\n`,
      TYPE_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it(".dto.ts의 클래스 선언도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(`export class FixtureDto {}\n`, DTO_FILE);

    expect(ruleIds).toContain(RULE_ID);
  });

  it(".dto.ts의 함수 선언도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function fixture() {\n  return 1;\n}\n`,
      DTO_FILE,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it(".dto.ts의 열 목록 상수는 DB 열 이름이라 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const FIXTURE_COLUMNS = ["id", "name"] as const;\n\nexport const OTHER_COLUMNS = "id, name";\n`,
      DTO_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입 별칭과 인터페이스와 `export type`은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `type Inner = { id: string };\n\nexport interface Fixture {\n  inner: Inner;\n}\n\nexport type FixtureId = Fixture["inner"]["id"];\n\nexport type { Inner };\n`,
      TYPE_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`import type`을 든 .dto.ts는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { Fixture } from "@/shared/model/fixture.type";\n\nexport type FixtureDto = Fixture;\n`,
      DTO_FILE,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("접미사가 다른 파일의 클래스는 대상이 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      `export class FixtureError extends Error {}\n`,
      "src/shared/model/errors.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it(".policy.ts의 함수는 대상이 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      `export function isFixture() {\n  return true;\n}\n`,
      "src/shared/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
