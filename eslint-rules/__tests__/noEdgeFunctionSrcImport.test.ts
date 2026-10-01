// 구현 대상: eslint-rules/noEdgeFunctionSrcImport.mjs (notification-push plan AC-10)
//
// Deno는 `supabase/functions` 밖을 못 읽는다(notification/design.md 「푸시 보내기」 끝).
// `import-holidays`(#464)가 `../../../src/...`를 직접 가리켜 이미 한 번 경계를 넘었다
// (관찰 035). edge-runtime을 안 띄우는 로컬·CI는 이 import를 걸러내지 못하니 글자로
// 막는 규칙이 필요하다 — 규칙 이름은 house/no-edge-function-src-import로 정했다.

import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-edge-function-src-import";

function importCode(specifier: string) {
  return `import { thing } from "${specifier}";\n\nexport function run() {\n  return thing;\n}\n`;
}

describe("house/no-edge-function-src-import — 마운트 밖 src import를 글자로 막는다", () => {
  it("supabase/functions/ 아래에서 ../../../src/... import가 걸린다", async () => {
    const violations = await violationsOf(
      importCode("../../../src/entities/notification/model/pushMessage"),
      "supabase/functions/send-push/index.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(RULE_ID);
  });

  it("../_shared/... import는 안 걸린다", async () => {
    const violations = await violationsOf(
      importCode("../_shared/notification/pushMessage.ts"),
      "supabase/functions/send-push/index.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      RULE_ID,
    );
  });

  it.each([
    "npm:@supabase/supabase-js@2.112.4",
    "jsr:@std/http",
    "https://deno.land/std/http/server.ts",
  ])("%s 같은 외부 지정자는 안 걸린다", async (specifier) => {
    const violations = await violationsOf(
      importCode(specifier),
      "supabase/functions/send-push/index.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      RULE_ID,
    );
  });

  it("규칙 메시지가 고치는 길(_shared 복사본)을 가리킨다", async () => {
    const violations = await violationsOf(
      importCode("../../../src/entities/notification/model/pushMessage"),
      "supabase/functions/send-push/index.ts",
    );
    const target = violations.find((violation) => violation.ruleId === RULE_ID);

    expect(target?.message).toContain("_shared");
  });

  it("supabase/functions/ 밖의 파일에는 이 규칙이 안 걸린다", async () => {
    const violations = await violationsOf(
      importCode("../../../src/entities/notification/model/pushMessage"),
      "scripts/unrelated-script.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      RULE_ID,
    );
  });
});
