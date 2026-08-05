import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../test-placement.mjs";

const ruleTester = createRuleTester();

describe("test-placement", () => {
  ruleTester.run("test-placement", rule, {
    valid: [
      {
        name: "__tests__ 하위의 .test 파일은 허용한다",
        filename: "src/app/__tests__/manifest.test.ts",
        code: "export const a = 1;",
      },
      {
        name: "세그먼트 __tests__ 하위의 .test 파일도 허용한다",
        filename: "src/widgets/offline/hooks/__tests__/useOnlineStatus.test.ts",
        code: "export const a = 1;",
      },
      {
        name: "테스트 패턴이 아닌 파일은 판정하지 않는다",
        filename: "src/shared/lib/format-date.ts",
        code: "export const a = 1;",
      },
    ],
    invalid: [
      {
        name: "colocated .test 파일은 배치 위반이다",
        filename: "src/app/manifest.test.ts",
        code: "export const a = 1;",
        errors: [{ messageId: "placement" }],
      },
      {
        name: "colocated .spec 파일은 접미사와 배치 둘 다 위반이다",
        filename: "src/app/manifest.spec.ts",
        code: "export const a = 1;",
        errors: [{ messageId: "suffix" }, { messageId: "placement" }],
      },
      {
        name: "__tests__ 하위에 있어도 .spec 접미사는 위치와 무관하게 위반이다",
        filename: "src/app/__tests__/manifest.spec.ts",
        code: "export const a = 1;",
        errors: [{ messageId: "suffix" }],
      },
    ],
  });
});
