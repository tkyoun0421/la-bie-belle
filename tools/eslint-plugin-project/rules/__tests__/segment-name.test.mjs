import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../segment-name.mjs";

const ruleTester = createRuleTester();

describe("segment-name", () => {
  ruleTester.run("segment-name", rule, {
    valid: [
      {
        name: "계약에 있는 세그먼트는 통과한다",
        filename: "src/views/shift/ui/ShiftScreen.tsx",
        code: "export const a = 1;",
      },
      {
        name: "shared 계층의 세그먼트도 같은 목록을 따른다",
        filename: "src/shared/lib/date.ts",
        code: "export const a = 1;",
      },
      {
        name: "app 계층은 세그먼트 판정 대상이 아니다",
        filename: "src/app/dashboard/page.tsx",
        code: "export default function Page() { return null; }",
      },
      {
        name: "세그먼트 없이 슬라이스 바로 아래 있는 파일은 판정하지 않는다",
        filename: "src/entities/shift/thing.ts",
        code: "export const a = 1;",
      },
      {
        name: "src 밖은 판정하지 않는다",
        filename: "tools/eslint-plugin-project/index.mjs",
        code: "export const a = 1;",
      },
    ],
    invalid: [
      {
        name: "계약에 없는 세그먼트는 막는다",
        filename: "src/views/shift/components/Card.tsx",
        code: "export const a = 1;",
        errors: [{ messageId: "unknownSegment" }],
      },
      {
        name: "shared 계층의 임의 세그먼트도 막는다",
        filename: "src/shared/utils/date.ts",
        code: "export const a = 1;",
        errors: [{ messageId: "unknownSegment" }],
      },
      {
        name: "예전 tdd-guard가 예외 처리하던 이름도 계약에 없으면 막는다",
        filename: "src/entities/shift/helpers/calc.ts",
        code: "export const a = 1;",
        errors: [{ messageId: "unknownSegment" }],
      },
    ],
  });
});
