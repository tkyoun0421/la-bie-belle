import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../design-token-colors.mjs";

const ruleTester = createRuleTester();

describe("design-token-colors", () => {
  ruleTester.run("design-token-colors", rule, {
    valid: [
      {
        name: "의미 토큰 클래스는 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-action text-on-action border-action-border";',
      },
      {
        name: "typo 유틸은 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "typo-body";',
      },
      {
        name: "색상과 무관한 임의값은 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "w-[240px]";',
      },
      {
        name: "variant 접두 + 의미 토큰은 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "hover:bg-action-pressed";',
      },
      {
        name: "샤드 번호 없는 neutral 의미 토큰은 허용한다(기본 팔레트 neutral과 이름 충돌)",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-neutral-surface text-neutral";',
      },
    ],
    invalid: [
      {
        name: "임의 hex 색상값을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-[#fff7d6]";',
        errors: [{ messageId: "arbitraryColor" }],
      },
      {
        name: "임의 rgb() 색상값을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "text-[rgb(0,0,0)]";',
        errors: [{ messageId: "arbitraryColor" }],
      },
      {
        name: "Tailwind 기본 팔레트 클래스를 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-gray-200";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "shade 없는 white/black도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "text-white";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "variant 접두가 있어도 기본 팔레트는 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "hover:bg-blue-600";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "템플릿 리터럴 안의 기본 팔레트도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: "export const a = `text-gray-500 font-bold`;",
        errors: [{ messageId: "defaultPalette" }],
      },
    ],
  });
});
