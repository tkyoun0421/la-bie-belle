import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../motion-tokens.mjs";

const ruleTester = createRuleTester();

describe("motion-tokens", () => {
  ruleTester.run("motion-tokens", rule, {
    valid: [
      {
        name: "토큰을 참조하는 duration 표기는 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "transition-colors duration-[var(--duration-feedback)]";',
      },
      {
        name: "토큰을 참조하는 easing 표기는 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "ease-[var(--ease-spring)]";',
      },
      {
        name: "토큰을 참조하는 delay 표기는 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "delay-[var(--duration-stagger)]";',
      },
      {
        name: "transform·opacity 전이는 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "transition-transform transition-opacity";',
      },
      {
        name: "색상 전이는 레이아웃을 건드리지 않으므로 허용한다",
        filename: "src/shared/ui/button.tsx",
        code: 'export const a = "transition-colors";',
      },
      {
        name: "Tailwind 기본 애니메이션 유틸은 허용한다",
        filename: "src/shared/ui/button.tsx",
        code: 'export const a = "animate-spin animate-pulse";',
      },
      {
        name: "애니메이션과 무관한 임의값은 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "w-[240px] min-h-[44px]";',
      },
      {
        name: "style 속성의 토큰 참조는 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const Foo = () => <div style={{ transitionDuration: "var(--duration-value)" }} />;',
      },
      {
        name: "애니메이션과 무관한 style 시간 문자열은 허용한다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const Foo = () => <div data-at="200ms" />;',
      },
    ],
    invalid: [
      {
        name: "transition-all은 레이아웃 속성까지 전이시키므로 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "transition-all";',
        errors: [{ messageId: "layoutAnimation" }],
      },
      {
        name: "레이아웃 속성을 지정한 transition은 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "transition-[width]";',
        errors: [{ messageId: "layoutAnimation" }],
      },
      {
        name: "레이아웃 속성이 섞인 transition 목록도 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "transition-[opacity,height]";',
        errors: [{ messageId: "layoutAnimation" }],
      },
      {
        name: "위치 속성 전이도 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "transition-[top]";',
        errors: [{ messageId: "layoutAnimation" }],
      },
      {
        name: "토큰 밖 duration 임의값을 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "duration-[200ms]";',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "토큰 밖 easing 임의값을 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "ease-[cubic-bezier(0.4,0,0.2,1)]";',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "토큰 밖 delay 임의값을 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "delay-[80ms]";',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "색상 토큰을 시간 자리에 쓰는 표기도 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "duration-[var(--color-action)]";',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "수식어가 붙은 임의값도 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const a = "hover:duration-[300ms]";',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "템플릿 리터럴 안의 임의값도 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: "export const a = `transition-colors duration-[120ms]`;",
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "style 속성의 시간 리터럴을 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const Foo = () => <div style={{ transitionDuration: "200ms" }} />;',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
      {
        name: "style 속성의 easing 리터럴을 막는다",
        filename: "src/shared/ui/chip.tsx",
        code: 'export const Foo = () => <div style={{ animationTimingFunction: "ease-in-out" }} />;',
        errors: [{ messageId: "arbitraryMotionValue" }],
      },
    ],
  });
});
