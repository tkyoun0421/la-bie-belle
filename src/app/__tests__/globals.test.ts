import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "../globals.css"), "utf8");

describe("globals.css 디자인 토큰", () => {
  it("Tailwind 기본 색 팔레트를 비활성화한다", () => {
    expect(css).toMatch(/--color-\*:\s*initial;/);
  });

  it.each([
    ["--raw-blue-500", "#0052ff"],
    ["--raw-blue-700", "#003ecc"],
    ["--raw-blue-200", "#a8b8cc"],
    ["--raw-ink-950", "#0a0b0d"],
    ["--raw-gray-700", "#5b616e"],
    ["--raw-gray-600", "#7c828a"],
    ["--raw-gray-400", "#a8acb3"],
    ["--raw-gray-300", "#dee1e6"],
    ["--raw-gray-200", "#eef0f3"],
    ["--raw-gray-100", "#f7f7f7"],
    ["--raw-white", "#ffffff"],
    ["--raw-green-500", "#05b169"],
    ["--raw-red-500", "#cf202f"],
    ["--raw-yellow-500", "#f4b000"],
  ])("원시 팔레트 %s는 %s다", (name, hex) => {
    const pattern = new RegExp(`${name}:\\s*${hex};`);
    expect(css).toMatch(pattern);
  });

  it.each([
    ["--color-action", "var(--raw-blue-500)"],
    ["--color-action-surface", "#eef4ff"],
    ["--color-action-border", "#b8ceff"],
    ["--color-action-pressed", "var(--raw-blue-700)"],
    ["--color-action-pressed-surface", "#e2ebff"],
    ["--color-action-pressed-border", "var(--raw-blue-500)"],
    ["--color-success", "#087a4b"],
    ["--color-success-surface", "#e8f8f1"],
    ["--color-success-border", "#9bddc2"],
    ["--color-warning", "#765500"],
    ["--color-warning-surface", "#fff7d6"],
    ["--color-warning-border", "#f1cf61"],
    ["--color-danger", "#b01825"],
    ["--color-danger-surface", "#fff0f1"],
    ["--color-danger-border", "#efb4ba"],
    ["--color-neutral", "var(--raw-gray-700)"],
    ["--color-neutral-surface", "var(--raw-gray-100)"],
    ["--color-neutral-border", "var(--raw-gray-300)"],
    ["--color-disabled", "var(--raw-gray-700)"],
    ["--color-disabled-surface", "var(--raw-gray-200)"],
    ["--color-disabled-border", "var(--raw-gray-300)"],
  ])("의미 토큰 %s는 %s다", (name, value) => {
    const pattern = new RegExp(`${name}:\\s*${value.replace(/[()]/g, "\\$&")};`);
    expect(css).toMatch(pattern);
  });

  it.each([
    ["--color-text-strong", "var(--raw-ink-950)"],
    ["--color-text", "var(--raw-gray-700)"],
    ["--color-text-muted", "var(--raw-gray-600)"],
    ["--color-text-weak", "var(--raw-gray-400)"],
    ["--color-surface", "var(--raw-white)"],
    ["--color-surface-weak", "var(--raw-gray-100)"],
    ["--color-surface-strong", "var(--raw-gray-200)"],
    ["--color-border", "var(--raw-gray-300)"],
    ["--color-on-action", "var(--raw-white)"],
  ])("텍스트/표면 토큰 %s는 %s다", (name, value) => {
    const pattern = new RegExp(`${name}:\\s*${value.replace(/[()]/g, "\\$&")};`);
    expect(css).toMatch(pattern);
  });

  it.each([
    ["typo-display", "32px", "40px", "700"],
    ["typo-headline-lg", "26px", "34px", "700"],
    ["typo-headline-md", "22px", "30px", "700"],
    ["typo-title", "18px", "26px", "600"],
    ["typo-body", "16px", "24px", "400"],
    ["typo-body-strong", "16px", "24px", "600"],
    ["typo-label", "14px", "20px", "600"],
    ["typo-caption", "13px", "18px", "400"],
  ])("타이포 유틸 %s는 %s/%s·%s다", (name, size, lineHeight, weight) => {
    const blockPattern = new RegExp(`@utility ${name}\\s*\\{([^}]*)\\}`);
    const match = blockPattern.exec(css);
    expect(match, `${name} 블록이 없습니다`).not.toBeNull();
    const block = match?.[1] ?? "";
    expect(block).toMatch(new RegExp(`font-size:\\s*${size};`));
    expect(block).toMatch(new RegExp(`line-height:\\s*${lineHeight};`));
    expect(block).toMatch(new RegExp(`font-weight:\\s*${weight};`));
  });

  it.each([
    ["--radius-sm", "8px"],
    ["--radius-md", "14px"],
    ["--radius-lg", "16px"],
    ["--radius-xl", "20px"],
    ["--radius-pill", "9999px"],
  ])("radius 토큰 %s는 %s다", (name, value) => {
    const pattern = new RegExp(`${name}:\\s*${value};`);
    expect(css).toMatch(pattern);
  });

  it("shadow-floating은 명세 값 그대로다", () => {
    expect(css).toMatch(/--shadow-floating:\s*0 8px 24px rgba\(10, 11, 13, 0\.08\);/);
  });

  it.each([
    ["--duration-feedback", "150ms"],
    ["--duration-value", "200ms"],
    ["--duration-overlay", "250ms"],
  ])("모션 duration %s는 %s다", (name, value) => {
    const pattern = new RegExp(`${name}:\\s*${value};`);
    expect(css).toMatch(pattern);
  });

  it.each([["--ease-out"], ["--ease-spring"]])(
    "easing 토큰 %s가 cubic-bezier로 정의된다",
    (name) => {
      const pattern = new RegExp(`${name}:\\s*cubic-bezier\\([^)]+\\);`);
      expect(css).toMatch(pattern);
    },
  );

  it("항목 간 지연 토큰 --duration-stagger가 ms 단위로 정의된다", () => {
    expect(css).toMatch(/--duration-stagger:\s*\d+ms;/);
  });

  it.each([["--spring-stiffness"], ["--spring-damping"]])(
    "spring 상수 %s가 단위 없는 숫자로 정의된다",
    (name) => {
      const pattern = new RegExp(`${name}:\\s*\\d+(\\.\\d+)?;`);
      expect(css).toMatch(pattern);
    },
  );

  describe("서드파티 모션 타이밍 조율", () => {
    it("vaul 시트가 토큰 시간과 easing을 쓴다", () => {
      const block =
        /\[data-vaul-drawer\]\[data-vaul-drawer-direction\]\[data-state\]\s*\{([^}]*)\}/.exec(css);
      expect(block, "vaul 시트 규칙이 없습니다").not.toBeNull();
      expect(block?.[1]).toMatch(/transition-duration:\s*var\(--duration-overlay\);/);
      expect(block?.[1]).toMatch(/transition-timing-function:\s*var\(--ease-out\);/);
      expect(block?.[1]).toMatch(/animation-duration:\s*var\(--duration-overlay\);/);
    });

    it("vaul 오버레이가 토큰 시간을 쓴다", () => {
      const block =
        /\[data-vaul-overlay\]\[data-vaul-snap-points\]\[data-state\]\s*\{([^}]*)\}/.exec(css);
      expect(block, "vaul 오버레이 규칙이 없습니다").not.toBeNull();
      expect(block?.[1]).toMatch(/transition-duration:\s*var\(--duration-overlay\);/);
      expect(block?.[1]).toMatch(/animation-duration:\s*var\(--duration-overlay\);/);
    });

    it("sonner 스낵바가 토큰 시간을 쓰되 스와이프 중에는 건드리지 않는다", () => {
      const block = /\[data-sonner-toast\]:not\(\[data-swiping="true"\]\)\s*\{([^}]*)\}/.exec(css);
      expect(block, "sonner 규칙이 없습니다").not.toBeNull();
      expect(block?.[1]).toMatch(/transition-duration:\s*var\(--duration-overlay\);/);
      expect(block?.[1]).toMatch(/transition-timing-function:\s*var\(--ease-out\);/);
    });

    it("sonner의 제거 상태 규칙보다 높은 명시도로 토큰 시간을 건다", () => {
      const block =
        /\[data-sonner-toast\]\[data-removed\]\[data-front\]\[data-swipe-out\]\[data-expanded\]:not\(\s*\[data-swiping="true"\]\s*\)\s*\{([^}]*)\}/.exec(
          css,
        );
      expect(block, "sonner 제거 상태 규칙이 없습니다").not.toBeNull();
      expect(block?.[1]).toMatch(/transition-duration:\s*var\(--duration-overlay\);/);
      expect(block?.[1]).toMatch(/transition-timing-function:\s*var\(--ease-out\);/);
    });

    it("sonner의 스와이프 아웃 애니메이션도 토큰 시간을 쓴다", () => {
      const block =
        /\[data-sonner-toast\]\[data-swipe-out="true"\]\[data-y-position\]\[data-styled\]\s*\{([^}]*)\}/.exec(
          css,
        );
      expect(block, "sonner 스와이프 아웃 규칙이 없습니다").not.toBeNull();
      expect(block?.[1]).toMatch(/animation-duration:\s*var\(--duration-overlay\);/);
      expect(block?.[1]).toMatch(/animation-timing-function:\s*var\(--ease-out\);/);
    });

    it("서드파티 조율에 !important를 쓰지 않는다", () => {
      const vaulAndSonner = css
        .split("\n")
        .filter((line) => /data-vaul|data-sonner/.test(line))
        .join("\n");
      expect(vaulAndSonner).not.toMatch(/!important/);
    });
  });

  describe("다이얼로그 모션", () => {
    const dialogFrames = () => [
      ...css.matchAll(/@keyframes\s+dialog-(?:in|out)\s*\{([\s\S]*?)\n\}/g),
    ];

    it("진입·이탈 keyframes를 모두 정의한다", () => {
      expect(dialogFrames()).toHaveLength(2);
    });

    it("keyframes가 위치를 옮기지 않아 중앙 정렬 유틸과 합성되지 않는다", () => {
      for (const frame of dialogFrames()) {
        expect(frame[1]).not.toMatch(/translate/);
        expect(frame[1]).toMatch(/transform:\s*scale\(/);
      }
    });
  });

  it("폰트 체인에 Wanted Sans Variable과 명세 대체 순서를 포함한다", () => {
    expect(css).toMatch(/var\(--font-wanted-sans\)/);
    expect(css).toMatch(/-apple-system/);
    expect(css).toMatch(/BlinkMacSystemFont/);
    expect(css).toMatch(/system-ui/);
    expect(css).toMatch(/Segoe UI/);
    expect(css).toMatch(/Apple SD Gothic Neo/);
    expect(css).toMatch(/sans-serif/);
  });

  it("prefers-reduced-motion 전역 규칙이 있다", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  describe("prefers-reduced-motion 토큰 덮어쓰기", () => {
    const reduced = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/.exec(css);
    const block = reduced?.[1] ?? "";

    it.each([
      ["--duration-feedback"],
      ["--duration-value"],
      ["--duration-overlay"],
      ["--duration-stagger"],
    ])("시간 토큰 %s를 0으로 덮는다", (name) => {
      expect(block).toMatch(new RegExp(`${name}:\\s*0m?s;`));
    });

    it.each([["--spring-stiffness"], ["--spring-damping"]])(
      "spring 상수 %s는 덮어쓰지 않는다",
      (name) => {
        expect(block).not.toMatch(new RegExp(`${name}:`));
      },
    );

    it("전역 안전망 규칙을 유지한다", () => {
      expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important;/);
      expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important;/);
    });
  });

  it("focus-visible에 명확한 action ring이 전역으로 적용된다", () => {
    const blockPattern = /:focus-visible\s*\{([^}]*)\}/;
    const match = blockPattern.exec(css);
    expect(match, "focus-visible 블록이 없습니다").not.toBeNull();
    const block = match?.[1] ?? "";
    expect(block).toMatch(/outline/);
    expect(block).toMatch(/var\(--color-action\)/);
  });

  describe("순차 등장 모션", () => {
    const staggerFrame = () => /@keyframes\s+stagger-in\s*\{([\s\S]*?)\n\}/.exec(css);

    it("stagger-in keyframes를 정의한다", () => {
      expect(staggerFrame()).not.toBeNull();
    });

    it("transform과 opacity만 애니메이션한다", () => {
      const frame = staggerFrame();
      expect(frame?.[1]).toMatch(/opacity:/);
      expect(frame?.[1]).toMatch(/transform:/);
      expect(frame?.[1]).not.toMatch(/(?<!-)(width|height|top|left|right|bottom|margin|padding):/);
    });

    it("motion-stagger-item 유틸이 stagger-index와 duration-stagger로 지연을 계산한다", () => {
      const blockPattern = /@utility motion-stagger-item\s*\{([^}]*)\}/;
      const match = blockPattern.exec(css);
      expect(match, "motion-stagger-item 유틸이 없습니다").not.toBeNull();
      const block = match?.[1] ?? "";
      expect(block).toMatch(/animation:\s*stagger-in var\(--duration-value\)/);
      expect(block).toMatch(
        /animation-delay:\s*calc\(var\(--stagger-index,\s*0\)\s*\*\s*var\(--duration-stagger\)\);/,
      );
    });
  });

  it("overscroll-behavior-y: contain이 body에 전역으로 적용돼 브라우저 기본 당겨서 새로고침을 막는다", () => {
    const blockPattern = /^body\s*\{([^}]*)\}/m;
    const match = blockPattern.exec(css);
    expect(match, "body 블록이 없습니다").not.toBeNull();
    const block = match?.[1] ?? "";
    expect(block).toMatch(/overscroll-behavior-y:\s*contain;/);
  });
});
