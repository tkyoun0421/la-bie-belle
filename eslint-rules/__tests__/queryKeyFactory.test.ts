import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/query-key-factory";

const SERVICE_FILE = "src/entities/fixture/services/useFixtureQuery.ts";
const FACTORY_FILE = "src/shared/api/queryKeys.ts";

const FILTER_METHODS = [
  "invalidateQueries",
  "removeQueries",
  "resetQueries",
  "cancelQueries",
  "refetchQueries",
];

function cacheCall(method: string, args: string) {
  return `export function run(queryClient: { ${method}: (...args: unknown[]) => unknown }) {\n  return queryClient.${method}(${args});\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/query-key-factory", () => {
  it("`queryKey:`에 배열 리터럴을 적으면 걸린다", async () => {
    const code = `export const options = {\n  queryKey: ["fixture", "month"],\n  queryFn: async () => undefined,\n};\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).toContain(RULE_ID);
  });

  it("`mutationKey:`에 배열 리터럴을 적으면 걸린다", async () => {
    const code = `export const options = {\n  mutationKey: ["fixture", "save"],\n  mutationFn: async () => undefined,\n};\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).toContain(RULE_ID);
  });

  it("문자열 키로 적은 `queryKey`도 걸린다", async () => {
    const code = `export const options = {\n  "queryKey": ["fixture"],\n};\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).toContain(RULE_ID);
  });

  it("팩토리를 부른 결과는 통과한다", async () => {
    const code = `import { queryKeys } from "@/shared/api/queryKeys";\n\nexport const options = {\n  queryKey: queryKeys.schedule.month("2026-10"),\n  queryFn: async () => undefined,\n};\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).not.toContain(RULE_ID);
  });

  it("팩토리가 내놓은 접두사를 그대로 넘기는 것도 통과한다", async () => {
    const code = `import { queryKeys } from "@/shared/api/queryKeys";\n\nexport function run(queryClient: { invalidateQueries: (filters: unknown) => void }) {\n  queryClient.invalidateQueries({ queryKey: queryKeys.member.all });\n}\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).not.toContain(RULE_ID);
  });

  it.each(FILTER_METHODS)("`%s`의 키 배열 리터럴이 걸린다", async (method) => {
    const code = `export function run(queryClient: { ${method}: (filters: unknown) => void }) {\n  queryClient.${method}({ queryKey: ["fixture"] });\n}\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).toContain(RULE_ID);
  });

  it("`getQueryData`에 배열을 바로 넘기면 걸린다", async () => {
    expect(
      await ruleIdsOf(
        cacheCall("getQueryData", '["fixture", "month"]'),
        SERVICE_FILE,
      ),
    ).toContain(RULE_ID);
  });

  it("`setQueryData`에 배열을 바로 넘기면 걸린다", async () => {
    expect(
      await ruleIdsOf(
        cacheCall("setQueryData", '["fixture"], undefined'),
        SERVICE_FILE,
      ),
    ).toContain(RULE_ID);
  });

  it("`getQueryData`에 팩토리 결과를 넘기는 것은 통과한다", async () => {
    const code = `import { queryKeys } from "@/shared/api/queryKeys";\n\nexport function run(queryClient: { getQueryData: (key: unknown) => unknown }) {\n  return queryClient.getQueryData(queryKeys.member.all);\n}\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).not.toContain(RULE_ID);
  });

  it("캐시 키가 아닌 속성의 배열은 통과한다", async () => {
    const code = `export const options = {\n  positions: ["hall", "kitchen"],\n};\n`;

    expect(await ruleIdsOf(code, SERVICE_FILE)).not.toContain(RULE_ID);
  });

  it("팩토리가 사는 파일도 이름으로 면제받지 않는다", async () => {
    const code = `export const fixtureOptions = {\n  queryKey: ["fixture"],\n} as const;\n`;

    expect(await ruleIdsOf(code, FACTORY_FILE)).toContain(RULE_ID);
  });

  it("팩토리가 내놓는 배열은 키 자리에 안 서서 통과한다", async () => {
    const code = `export const queryKeys = {\n  fixture: { all: ["fixture"] as const },\n} as const;\n`;

    expect(await ruleIdsOf(code, FACTORY_FILE)).not.toContain(RULE_ID);
  });

  it("`__tests__/`는 규칙 밖이다", async () => {
    const code = `export const expected = {\n  queryKey: ["fixture", "month"],\n};\n`;

    expect(
      await ruleIdsOf(
        code,
        "src/entities/fixture/__tests__/fixtureQuery.test.ts",
      ),
    ).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 팩토리 파일과 걸린 속성 이름을 든다", async () => {
    const code = `export const options = {\n  queryKey: ["fixture"],\n};\n`;
    const violations = await violationsOf(code, SERVICE_FILE);
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/shared\/api\/queryKeys\.ts/);
    expect(message).toMatch(/queryKey/);
  });
});
