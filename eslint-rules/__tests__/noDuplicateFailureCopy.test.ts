import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-duplicate-failure-copy";

const CANON_FILE = "src/shared/consts/error.const.ts";

const CONST_FILE = "src/features/fixture/consts/fixture.const.ts";

const SCREEN_FILE = "src/features/fixture/ui/FixtureSheet.tsx";

const POLICY_FILE = "src/screens/fixture/model/fixture.policy.ts";

async function ruleIdsOf(code: string, filePath = CONST_FILE) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/no-duplicate-failure-copy", () => {
  it("COPY 객체가 글자를 직접 든 꼴이 걸린다", async () => {
    const code = [
      "export const FIXTURE_COPY = {",
      '  sendFailed: "보내지 못했어요. 다시 시도해주세요",',
      "} as const;",
    ].join("\n");

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("`.ts`의 지역 상수도 걸린다", async () => {
    const code = 'const SEND_FAILED = "보내지 못했어요. 다시 시도해주세요";\n';

    expect(await ruleIdsOf(code, POLICY_FILE)).toContain(RULE_ID);
  });

  it("`.tsx`의 JSX 생문안도 걸린다", async () => {
    const code = [
      "export function FixtureSheet() {",
      "  return <Text>보내지 못했어요. 다시 시도해주세요</Text>;",
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code, SCREEN_FILE)).toContain(RULE_ID);
  });

  it("템플릿 문자열에 박아도 걸린다", async () => {
    const code =
      "const line = `보내지 못했어요. 다시 시도해주세요 (${code})`;\n";

    expect(await ruleIdsOf(code, POLICY_FILE)).toContain(RULE_ID);
  });

  it("글자를 품은 더 긴 문장도 걸린다", async () => {
    const code =
      'const SEND_FAILED = "보내지 못했어요. 다시 시도해주세요 — 잠시 뒤에요";\n';

    expect(await ruleIdsOf(code, POLICY_FILE)).toContain(RULE_ID);
  });

  it("공용 상수를 가리키는 꼴은 통과한다", async () => {
    const code = [
      'import { TRANSPORT_ERROR_COPY } from "@/shared/consts/error.const";',
      "",
      "export const FIXTURE_COPY = {",
      "  sendFailed: TRANSPORT_ERROR_COPY,",
      "} as const;",
    ].join("\n");

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("다른 실패 문안은 통과한다", async () => {
    const code = [
      "export const FIXTURE_COPY = {",
      '  loadFailed: "불러오지 못했어요",',
      "} as const;",
    ].join("\n");

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("정본 파일에서는 통과한다", async () => {
    const code =
      'export const TRANSPORT_ERROR_COPY = "보내지 못했어요. 다시 시도해주세요";\n';

    expect(await ruleIdsOf(code, CANON_FILE)).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 어느 상수를 가리켜야 하는지 든다", async () => {
    const code = 'const SEND_FAILED = "보내지 못했어요. 다시 시도해주세요";\n';
    const message = (await violationsOf(code, POLICY_FILE)).find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/@\/shared\/consts\/error\.const/);
    expect(message).toMatch(/TRANSPORT_ERROR_COPY/);
  });
});
