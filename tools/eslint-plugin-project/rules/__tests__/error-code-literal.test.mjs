import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../error-code-literal.mjs";

const ruleTester = createRuleTester();

describe("error-code-literal", () => {
  ruleTester.run("error-code-literal", rule, {
    valid: [
      {
        name: "레지스트리 멤버 접근 비교는 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'import { ERROR_CODE } from "@/shared/config/error-codes.config";\n\nexport function check(code) {\n  return code === ERROR_CODE.COMMON_FORBIDDEN;\n}',
      },
      {
        name: "레지스트리 멤버 접근을 함수 인자로 전달하면 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'import { ERROR_CODES } from "@/shared/config/error-codes.config";\n\nfail(ERROR_CODES.COMMON_FORBIDDEN);',
      },
      {
        name: "접두가 아닌 UPPER_SNAKE 문자열은 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "SERVER_ONLY_MARKER";',
      },
      {
        name: "접두를 포함만 하는 단어는 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "COMMONLY_USED";',
      },
      {
        name: "소문자 문자열은 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "common_forbidden";',
      },
      {
        name: "레지스트리 정의 파일에서는 리터럴을 허용한다",
        filename: "src/shared/config/error-codes.config.ts",
        code: 'export const ERROR_CODES = {\n  COMMON_FORBIDDEN: { http: 403, message: "접근 권한이 없어요" },\n} as const;\n\nexport const ERROR_CODE = {\n  COMMON_FORBIDDEN: "COMMON_FORBIDDEN",\n} as const;',
      },
    ],
    invalid: [
      {
        name: "정본 밖 문자열 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "COMMON_FORBIDDEN";',
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "표현식 없는 템플릿 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: "export const a = `COMMON_FORBIDDEN`;",
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "IDENTITY 접두 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "IDENTITY_SESSION_EXPIRED";',
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "SCHEDULING 접두 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "SCHEDULING_SLOT_CLOSED";',
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "ATTENDANCE 접두 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "ATTENDANCE_ALREADY_CHECKED_IN";',
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "NOTIFICATIONS 접두 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "NOTIFICATIONS_SEND_FAILED";',
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "PAY 접두 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "PAY_CALCULATION_FAILED";',
        errors: [{ messageId: "literalErrorCode" }],
      },
      {
        name: "COMMON 접두 리터럴을 막는다",
        filename: "src/features/apply/api/apply.ts",
        code: 'export const a = "COMMON_UNEXPECTED";',
        errors: [{ messageId: "literalErrorCode" }],
      },
    ],
  });
});
