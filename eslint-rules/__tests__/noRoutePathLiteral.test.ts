import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-route-path-literal";

const CANON_FILE = "src/shared/consts/navigation.const.ts";

const POLICY_FILE = "src/entities/fixture/model/fixture.policy.ts";

const CONST_FILE = "src/screens/fixture/consts/fixture.const.ts";

const TYPE_FILE = "src/entities/fixture/model/fixture.type.ts";

const SCREEN_FILE = "src/screens/fixture/ui/FixtureScreen.tsx";

const ROUTE_FILE = "src/app/check-in.tsx";

const PAIR_TEST_FILE = "src/entities/fixture/model/__tests__/fixture.test.ts";

async function ruleIdsOf(code: string, filePath = POLICY_FILE) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/no-route-path-literal", () => {
  it("경로를 글자로 돌려주는 자리가 걸린다", async () => {
    const code = 'export const door = () => "/check-in";\n';

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("쿼리를 붙인 템플릿의 경로 조각도 걸린다", async () => {
    const code = "const door = `/schedule?date=${day}`;\n";

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("타입 자리의 리터럴 유니온도 걸린다", async () => {
    const code = 'export type Move = "/login" | "/pending" | null;\n';

    expect(await ruleIdsOf(code, TYPE_FILE)).toContain(RULE_ID);
  });

  it("배열에 담은 경로도 걸린다", async () => {
    const code = 'export const PREFIXES = ["/admin/schedule"];\n';

    expect(await ruleIdsOf(code, CONST_FILE)).toContain(RULE_ID);
  });

  it("화면 파일의 경로 글자도 걸린다", async () => {
    const code = [
      "export function FixtureScreen({ go }: { go: (to: string) => void }) {",
      '  return <Pressable onPress={() => go("/admin/approvals")} />;',
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code, SCREEN_FILE)).toContain(RULE_ID);
  });

  it("어느 상수를 가리켜야 하는지 메시지가 든다", async () => {
    const code = 'export const door = () => "/check-in";\n';
    const message = (await violationsOf(code, POLICY_FILE)).find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/@\/shared\/consts\/navigation\.const/);
    expect(message).toMatch(/CHECK_IN_PATH/);
  });

  it("더 긴 경로는 그 경로의 상수를 가리킨다", async () => {
    const code = 'export const door = () => "/admin/members/pending";\n';
    const message = (await violationsOf(code, POLICY_FILE)).find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/ADMIN_MEMBERS_PENDING_PATH/);
  });

  it("상수를 가리키는 꼴은 통과한다", async () => {
    const code = [
      'import { CHECK_IN_PATH } from "@/shared/consts/navigation.const";',
      "",
      "export const door = () => CHECK_IN_PATH;",
      "",
    ].join("\n");

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("상수를 끼운 템플릿은 통과한다", async () => {
    const code = [
      'import { WORKER_SCHEDULE_PATH } from "@/shared/consts/navigation.const";',
      "",
      "export const door = (day: string) =>",
      "  `${WORKER_SCHEDULE_PATH}?date=${day}`;",
      "",
    ].join("\n");

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("경로를 품기만 한 더 긴 이름은 통과한다", async () => {
    const code = 'export const door = () => "/statsboard";\n';

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("경로로 시작하지 않는 URL은 통과한다", async () => {
    const code = 'export const marker = "http://www.w3.org/2000/svg";\n';

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("슬래시 하나는 경로인지 가를 수 없어 통과한다", async () => {
    const code = 'export const parts = (one: string) => one.split("/");\n';

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("슬래시를 품은 정규식은 통과한다", async () => {
    const code =
      'export const trim = (one: string) => one.replace(/\\/+$/, "");\n';

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("정본 파일에서는 통과한다", async () => {
    const code = 'export const CHECK_IN_PATH = "/check-in" as const;\n';

    expect(await ruleIdsOf(code, CANON_FILE)).not.toContain(RULE_ID);
  });

  it("라우트 파일에서는 통과한다 — 파일 이름이 URL이다", async () => {
    const code = [
      "export default function CheckIn() {",
      '  return <Redirect href="/login" />;',
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code, ROUTE_FILE)).not.toContain(RULE_ID);
  });

  it("짝 테스트에서는 통과한다 — 단언이 글자를 직접 들어야 한다", async () => {
    const code = 'expect(door()).toBe("/check-in");\n';

    expect(await ruleIdsOf(code, PAIR_TEST_FILE)).not.toContain(RULE_ID);
  });
});
