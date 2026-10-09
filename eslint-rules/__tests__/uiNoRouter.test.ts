import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/ui-no-router";

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

const SCREEN_FILE = "src/screens/members/ui/MembersScreen.tsx";
const FRAGMENT_FILE = "src/features/memberAdmin/ui/MemberSheet.tsx";
const ENTITY_FILE = "src/entities/member/ui/MemberRows.tsx";
const SHARED_FILE = "src/shared/ui/AppBar.tsx";
const CONTROLLER_FILE = "src/features/memberAdmin/hooks/useMemberSheet.ts";

const ROUTER = `import { useRouter } from "expo-router";\n\nexport function Fixture() {\n  const router = useRouter();\n\n  return router;\n}\n`;

describe("house/ui-no-router — 갈 데는 조각이 안 든다", () => {
  it("`features/*/ui`가 `useRouter`를 쥐면 걸린다", async () => {
    expect(await ruleIdsOf(ROUTER, FRAGMENT_FILE)).toContain(RULE_ID);
  });

  it("`entities/*/ui`가 `useRouter`를 쥐면 걸린다", async () => {
    expect(await ruleIdsOf(ROUTER, ENTITY_FILE)).toContain(RULE_ID);
  });

  it("`screens/*/ui`가 `useRouter`를 쥐면 걸린다", async () => {
    expect(await ruleIdsOf(ROUTER, SCREEN_FILE)).toContain(RULE_ID);
  });

  it("`shared/ui`가 `useRouter`를 쥐면 걸린다", async () => {
    expect(await ruleIdsOf(ROUTER, SHARED_FILE)).toContain(RULE_ID);
  });

  it("controller는 `useRouter`를 쥔다", async () => {
    expect(await ruleIdsOf(ROUTER, CONTROLLER_FILE)).not.toContain(RULE_ID);
  });

  it("`usePathname`도 같이 막는다", async () => {
    const code = `import { usePathname } from "expo-router";\n\nexport function Fixture() {\n  return usePathname();\n}\n`;

    expect(await ruleIdsOf(code, FRAGMENT_FILE)).toContain(RULE_ID);
  });

  it("`useLocalSearchParams`도 같이 막는다", async () => {
    const code = `import { useLocalSearchParams } from "expo-router";\n\nexport function Fixture() {\n  return useLocalSearchParams();\n}\n`;

    expect(await ruleIdsOf(code, FRAGMENT_FILE)).toContain(RULE_ID);
  });

  it("`Link`는 통과한다", async () => {
    const code = `import { Link } from "expo-router";\n\nexport const Go = Link;\n`;

    expect(await ruleIdsOf(code, FRAGMENT_FILE)).not.toContain(RULE_ID);
  });

  it("`router.push` 같은 경로 리터럴은 이 규칙이 안 본다", async () => {
    const code = `export const path = "/admin/schedule";\n`;

    expect(await ruleIdsOf(code, FRAGMENT_FILE)).not.toContain(RULE_ID);
  });

  it("`src/app/`은 밖이다", async () => {
    expect(await ruleIdsOf(ROUTER, "src/app/admin/members.tsx")).not.toContain(
      RULE_ID,
    );
  });

  it("타입만 당기면 통과한다", async () => {
    const code = `import type { Href } from "expo-router";\n\nexport type To = Href;\n`;

    expect(await ruleIdsOf(code, FRAGMENT_FILE)).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 controller를 가리킨다", async () => {
    const violations = await violationsOf(ROUTER, FRAGMENT_FILE);
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/controller/);
  });
});
