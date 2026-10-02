// 구현 대상: eslint-rules/noNodeImportInEdgeShared.mjs (notification-push plan AC-10)
//
// `src/entities/notification/model/`은 CI가 `supabase/functions/_shared/`로 복사해
// Deno로 돌리는 폴더다(notification/design.md 「푸시 보내기」). 그 안에서 Node 전용
// API를 부르면 복사본이 런타임에서 깨진다 — 정본은 「lint가 막는다」고 이미 적는데
// 그 규칙이 저장소에 없었다.

import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-node-import-in-edge-shared";

const SHARED_FILE = "src/entities/notification/utils/pushMessage.utils.ts";

function importCode(specifier: string) {
  return `import { thing } from "${specifier}";\n\nexport function run() {\n  return thing;\n}\n`;
}

describe("house/no-node-import-in-edge-shared — Deno로 복사되는 폴더의 node: import를 막는다", () => {
  it.each(["node:crypto", "node:fs", "node:path"])(
    "%s import가 걸린다",
    async (specifier) => {
      const violations = await violationsOf(importCode(specifier), SHARED_FILE);

      expect(violations.map((violation) => violation.ruleId)).toContain(
        RULE_ID,
      );
    },
  );

  it("상수 폴더도 복사 대상이라 걸린다", async () => {
    const violations = await violationsOf(
      importCode("node:crypto"),
      "src/entities/notification/consts/notification.const.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(RULE_ID);
  });

  it("같은 폴더의 상대 import는 안 걸린다", async () => {
    const violations = await violationsOf(importCode("./title"), SHARED_FILE);

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      RULE_ID,
    );
  });

  it("복사되지 않는 폴더의 node: import는 안 걸린다", async () => {
    const violations = await violationsOf(
      importCode("node:crypto"),
      "src/shared/utils/spellNumber.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      RULE_ID,
    );
  });

  it("규칙 메시지가 Deno로 복사된다는 것을 든다", async () => {
    const violations = await violationsOf(
      importCode("node:crypto"),
      SHARED_FILE,
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/Deno/);
  });
});
