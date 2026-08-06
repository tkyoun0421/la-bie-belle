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
      {
        name: "hex처럼 시작하지 않는 anchor 문자열은 허용한다(과잉 탐지 방지)",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "#section";',
      },
      {
        name: "style 속성 밖의 hex 문자열은 허용한다(매니페스트 색상 등 무관한 문맥, 과잉 탐지 방지)",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const manifestColor = "#0052ff";',
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
      {
        name: "불투명도 수식이 붙은 기본 팔레트도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-black/40";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "불투명도 수식이 붙은 shade 팔레트도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "text-gray-500/80";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "앞쪽 important 수식(!) 팔레트도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "!bg-gray-200";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "뒤쪽 important 수식(!) 팔레트도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-gray-200!";',
        errors: [{ messageId: "defaultPalette" }],
      },
      {
        name: "JSX style 속성의 hex 문자열도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const Foo = () => <div style={{ color: "#fff7d6" }} />;',
        errors: [{ messageId: "arbitraryColor" }],
      },
      {
        name: "JSX style 속성의 rgb() 문자열도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const Foo = () => <div style={{ color: "rgb(0,0,0)" }} />;',
        errors: [{ messageId: "arbitraryColor" }],
      },
      {
        name: "임의값으로 원시 CSS 변수를 직접 참조하는 것도 막는다",
        filename: "src/shared/ui/badge.tsx",
        code: 'export const a = "bg-[var(--raw-blue-500)]";',
        errors: [{ messageId: "arbitraryColor" }],
      },
    ],
  });
});
