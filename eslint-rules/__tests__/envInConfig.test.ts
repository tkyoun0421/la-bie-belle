import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/env-in-config";

function readsProcessEnv() {
  return `export function readFixtureUrl() {\n  return process.env.EXPO_PUBLIC_FIXTURE_URL ?? null;\n}\n`;
}

function readsConstants() {
  return `import Constants from "expo-constants";\n\nexport function readFixtureId() {\n  return Constants.expoConfig?.extra?.fixtureId ?? null;\n}\n`;
}

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

describe("house/env-in-config — 환경이 주는 값을 읽는 자리를 config로 묶는다", () => {
  it("`utils/`가 `process.env`를 읽으면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      readsProcessEnv(),
      "src/features/fixture/utils/fixtureUrl.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`model/`이 `expo-constants`를 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      readsConstants(),
      "src/features/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`.tsx`가 환경값을 읽어도 걸린다", async () => {
    const code = `export function Fixture() {\n  return <div>{process.env.EXPO_PUBLIC_FIXTURE_URL}</div>;\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/screens/fixture/ui/Fixture.tsx");

    expect(ruleIds).toContain(RULE_ID);
  });

  it("객체째 넘기는 `process.env`도 걸린다", async () => {
    const code = `export function allEnv() {\n  return { ...process.env };\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/fixtureEnv.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("재수출로 `Constants`를 넘겨도 걸린다", async () => {
    const code = `export { default as Constants } from "expo-constants";\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixture/lib/fixtureShell.lib.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`config/`의 `process.env`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      readsProcessEnv(),
      "src/shared/config/fixture.config.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`config/`의 `expo-constants`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      readsConstants(),
      "src/shared/config/fixture.config.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("슬라이스의 `config/`도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      readsConstants(),
      "src/features/fixture/config/fixture.config.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/app/`의 라우트 파일은 세그먼트가 없어 통과한다", async () => {
    const code = `export default function Fixture() {\n  return <div>{process.env.EXPO_PUBLIC_FIXTURE_URL}</div>;\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/app/fixture.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("짝 테스트는 환경을 흉내 내니 통과한다", async () => {
    const code = `it("환경을 흉내 낸다", () => {\n  process.env.EXPO_PUBLIC_FIXTURE_URL = "https://fixture.test";\n  expect(process.env.EXPO_PUBLIC_FIXTURE_URL).toBe("https://fixture.test");\n});\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixture/utils/__tests__/fixtureUrl.utils.test.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`expo-constants`를 타입으로만 당기는 것은 통과한다", async () => {
    const code = `import type Constants from "expo-constants";\n\nexport function shapeOf(shell: typeof Constants) {\n  return shell;\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixture/model/fixture.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`__DEV__`는 환경이 주는 값이 아니라 통과한다", async () => {
    const code = `export function isDoorOpen(isDev: boolean) {\n  return isDev;\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/fixtureDoor.utils.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/` 밖의 스크립트는 세그먼트가 없어 통과한다", async () => {
    const ruleIds = await ruleIdsOf(readsProcessEnv(), "tests/lint/fixture.ts");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 `process.env`의 갈 자리를 든다", async () => {
    const violations = await violationsOf(
      readsProcessEnv(),
      "src/features/fixture/utils/fixtureUrl.utils.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/config\//);
  });

  it("규칙 메시지가 `expo-constants`의 갈 자리와 당긴 모듈을 든다", async () => {
    const violations = await violationsOf(
      readsConstants(),
      "src/features/fixture/model/fixture.policy.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/config\//);
    expect(message).toMatch(/expo-constants/);
  });
});
