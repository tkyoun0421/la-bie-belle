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

  it("focus-visible에 명확한 action ring이 전역으로 적용된다", () => {
    const blockPattern = /:focus-visible\s*\{([^}]*)\}/;
    const match = blockPattern.exec(css);
    expect(match, "focus-visible 블록이 없습니다").not.toBeNull();
    const block = match?.[1] ?? "";
    expect(block).toMatch(/outline/);
    expect(block).toMatch(/var\(--color-action\)/);
  });
});
