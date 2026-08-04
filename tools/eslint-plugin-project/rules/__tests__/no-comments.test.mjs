import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../no-comments.mjs";

const ruleTester = createRuleTester();

describe("no-comments", () => {
  ruleTester.run("no-comments", rule, {
    valid: [
      {
        name: "주석이 없으면 통과한다",
        filename: "src/shared/lib/date.ts",
        code: "export const a = 1;",
      },
      {
        name: "eslint-disable 지시자는 허용한다",
        filename: "src/shared/lib/date.ts",
        code: "// eslint-disable-next-line no-console\nexport const a = 1;",
      },
      {
        name: "eslint-disable 블록 지시자도 허용한다",
        filename: "src/shared/lib/date.ts",
        code: "/* eslint-disable no-console */\nexport const a = 1;",
      },
      {
        name: "@ts-expect-error 지시자는 허용한다",
        filename: "src/shared/lib/date.ts",
        code: "// @ts-expect-error 외부 타입 불일치\nexport const a = 1;",
      },
      {
        name: "@ts-ignore 지시자는 허용한다",
        filename: "src/shared/lib/date.ts",
        code: "// @ts-ignore\nexport const a = 1;",
      },
      {
        name: "harness 파일도 같은 규칙을 따른다",
        filename: "harness/lib/gate.ts",
        code: "export const a = 1;",
      },
    ],
    invalid: [
      {
        name: "줄 주석을 막는다",
        filename: "src/shared/lib/date.ts",
        code: "// 날짜를 포맷한다\nexport const a = 1;",
        errors: [{ messageId: "noComment" }],
      },
      {
        name: "블록 주석을 막는다",
        filename: "src/shared/lib/date.ts",
        code: "/* 날짜를 포맷한다 */\nexport const a = 1;",
        errors: [{ messageId: "noComment" }],
      },
      {
        name: "JSDoc 블록을 막는다",
        filename: "src/shared/lib/date.ts",
        code: "/**\n * 날짜를 포맷한다.\n */\nexport const a = 1;",
        errors: [{ messageId: "noJsDoc" }],
      },
      {
        name: "코드 뒤의 후행 주석도 막는다",
        filename: "src/shared/lib/date.ts",
        code: "export const a = 1; // 기본값",
        errors: [{ messageId: "noComment" }],
      },
      {
        name: "harness 파일의 JSDoc도 막는다",
        filename: "harness/lib/gate.ts",
        code: "/** 게이트를 실행한다. */\nexport const a = 1;",
        errors: [{ messageId: "noJsDoc" }],
      },
    ],
  });
});
