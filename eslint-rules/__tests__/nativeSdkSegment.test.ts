import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/native-sdk-segment";

async function ruleIdsOf(code: string, filePath: string) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/native-sdk-segment", () => {
  it("`services/`가 `expo-router`를 값으로 당기면 걸린다", async () => {
    const code = `import { router } from "expo-router";\n\nexport function useFixtureMutation() {\n  return () => router.replace("/login");\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixtureExit/services/useFixtureMutation.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`model/`이 `react-native`의 손을 당기면 걸린다", async () => {
    const code = `import { Platform } from "react-native";\n\nexport function decideFixture() {\n  return Platform.OS === "ios";\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/fixture/model/decideFixture.policy.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`utils/`가 `expo-constants`를 당기면 걸린다", async () => {
    const code = `import Constants from "expo-constants";\n\nexport function fixtureShell() {\n  return Constants.expoConfig?.name ?? "";\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/fixtureShell.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`api/`가 `expo` 자체를 당기면 걸린다", async () => {
    const code = `import { isRunningInExpoGo } from "expo";\n\nexport async function readFixture() {\n  return isRunningInExpoGo();\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/fixture/api/readFixture.api.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`react-native`의 하위 경로도 같은 SDK라 걸린다", async () => {
    const code = `import fixturePlatform from "react-native/Libraries/Utilities/Platform";\n\nexport function spellFixture() {\n  return String(fixturePlatform.OS);\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/spellFixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("재수출로 세그먼트를 빠져나가지 못한다", async () => {
    const code = `export { Alert } from "react-native";\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/fixtureAlert.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`import type`은 값을 안 당겨 통과한다", async () => {
    const code = `import type { Href } from "expo-router";\n\nexport function fixtureDestination(): Href {\n  return "/login";\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixtureExit/services/useFixtureMutation.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("쪽마다 `type`을 붙인 import도 통과한다", async () => {
    const code = `import { type ViewProps } from "react-native";\n\nexport type FixtureFace = ViewProps;\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/entities/fixture/model/fixture.type.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`lib/`은 부작용을 내는 손이라 통과한다", async () => {
    const code = `import { BackHandler } from "react-native";\n\nexport function wireFixtureBack(onBack: () => void) {\n  return BackHandler.addEventListener("hardwareBackPress", onBack);\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/shared/lib/fixtureBack.lib.ts");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`ui/`는 조각을 당겨 그리는 자리라 통과한다", async () => {
    const code = `import { Pressable, Text, View } from "react-native";\n\nexport function Fixture({ label }: { label: string }) {\n  return (\n    <View>\n      <Pressable>\n        <Text>{label}</Text>\n      </Pressable>\n    </View>\n  );\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/shared/ui/Fixture.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`hooks/`는 기기를 듣는 자리라 통과한다", async () => {
    const code = `import { AppState } from "react-native";\n\nexport function useFixtureForeground(onWake: () => void) {\n  return AppState.addEventListener("change", onWake);\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/hooks/useFixtureForeground.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`config/`는 `app.json`이 아는 값을 읽어야 해 통과한다", async () => {
    const code = `import Constants from "expo-constants";\n\nexport const fixtureProjectId =\n  Constants.expoConfig?.extra?.eas?.projectId ?? null;\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/features/fixtureExit/config/fixture.config.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`src/app/`은 Expo Router가 사는 자리라 통과한다", async () => {
    const code = `import { Stack } from "expo-router";\n\nexport default function FixtureLayout() {\n  return <Stack />;\n}\n`;

    const ruleIds = await ruleIdsOf(code, "src/app/fixture/_layout.tsx");

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`react-native-svg`는 서드파티라 안 문다", async () => {
    const code = `import Svg, { Path } from "react-native-svg";\n\nexport function fixtureChart() {\n  return { Svg, Path };\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/fixtureChart.utils.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`nativewind`는 서드파티라 안 문다", async () => {
    const code = `import { cssInterop } from "nativewind";\n\nexport function wireFixtureInterop() {\n  return cssInterop;\n}\n`;

    const ruleIds = await ruleIdsOf(
      code,
      "src/shared/utils/fixtureInterop.utils.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리와 걸린 세그먼트와 타입 길을 든다", async () => {
    const code = `import { router } from "expo-router";\n\nexport function useFixtureMutation() {\n  return () => router.replace("/login");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/features/fixtureExit/services/useFixtureMutation.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/lib\//);
    expect(message).toMatch(/services/);
    expect(message).toMatch(/import type/);
  });
});
