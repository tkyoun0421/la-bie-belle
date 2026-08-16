import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../spacing-scale.mjs";

const ruleTester = createRuleTester();

describe("spacing-scale", () => {
  ruleTester.run("spacing-scale", rule, {
    valid: [
      {
        name: "문서 값 4는 p 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "p-4";',
      },
      {
        name: "문서 값 2는 px 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "px-2";',
      },
      {
        name: "문서 값 6은 py 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "py-6";',
      },
      {
        name: "문서 값 1은 pt 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pt-1";',
      },
      {
        name: "문서 값 3은 pr 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pr-3";',
      },
      {
        name: "문서 값 5는 pl 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pl-5";',
      },
      {
        name: "문서 값 8은 m 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "m-8";',
      },
      {
        name: "문서 값 10은 mx 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "mx-10";',
      },
      {
        name: "문서 값 12는 mb 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "mb-12";',
      },
      {
        name: "문서 값은 gap 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "gap-4";',
      },
      {
        name: "문서 값은 gap-x 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "gap-x-2";',
      },
      {
        name: "문서 값은 gap-y 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "gap-y-6";',
      },
      {
        name: "문서 값은 space-x 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "space-x-4";',
      },
      {
        name: "문서 값은 space-y 유틸에서 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "space-y-2";',
      },
      {
        name: "modifier 접두가 있어도 문서 값이면 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "md:p-4";',
      },
      {
        name: "하단 고정 요소 목적 토큰 pb-nav-safe는 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pb-nav-safe";',
      },
      {
        name: "하단 고정 요소 목적 토큰 pb-nav-action-safe는 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pb-nav-action-safe";',
      },
      {
        name: "크기 계열 h는 간격 리듬 대상이 아니라 44 같은 문서 밖 숫자도 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "h-11";',
      },
      {
        name: "크기 계열 w는 대상이 아니다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "w-11";',
      },
      {
        name: "크기 계열 size는 대상이 아니다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "size-11";',
      },
      {
        name: "크기 계열의 임의값도 대상이 아니다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "h-[44px]";',
      },
      {
        name: "간격과 무관한 임의값 클래스는 허용한다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-[#fff]";',
      },
    ],
    invalid: [
      {
        name: "문서 밖 숫자 p-7을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "p-7";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "기존 관행값 pb-24를 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pb-24";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "문서 밖 숫자 gap-13을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "gap-13";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "문서 밖 숫자 mt-7을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "mt-7";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "문서 밖 숫자 space-y-13을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "space-y-13";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "modifier 접두가 있어도 문서 밖 숫자는 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "hover:p-7";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "앞쪽 important 수식(!)이 있어도 문서 밖 숫자는 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "!p-7";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "뒤쪽 important 수식(!)이 있어도 문서 밖 숫자는 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "p-7!";',
        errors: [{ messageId: "outOfScale" }],
      },
      {
        name: "임의값 pb-[92px]를 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "pb-[92px]";',
        errors: [{ messageId: "arbitraryValue" }],
      },
      {
        name: "임의값 m-[10px]을 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "m-[10px]";',
        errors: [{ messageId: "arbitraryValue" }],
      },
      {
        name: "임의값 gap-x-[14px]를 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "gap-x-[14px]";',
        errors: [{ messageId: "arbitraryValue" }],
      },
      {
        name: "템플릿 리터럴 안의 문서 밖 숫자도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: "export const a = `flex pb-24`;",
        errors: [{ messageId: "outOfScale" }],
      },
    ],
  });
});
