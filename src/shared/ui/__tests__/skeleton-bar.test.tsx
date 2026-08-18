import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SkeletonBar } from "@/shared/ui/skeleton-bar";

afterEach(cleanup);

describe("SkeletonBar", () => {
  it("--color-border 색과 radius-xs를 쓴다", () => {
    const { container } = render(<SkeletonBar className="h-4 w-24" />);
    const bar = container.firstElementChild;

    expect(bar).toHaveClass("bg-border");
    expect(bar).toHaveClass("rounded-xs");
  });

  it("임의값 radius를 쓰지 않는다", () => {
    const { container } = render(<SkeletonBar className="h-4 w-24" />);
    const bar = container.firstElementChild;

    expect(bar?.className).not.toMatch(/rounded-\[/);
  });

  it("반짝임 애니메이션이 없다", () => {
    const { container } = render(<SkeletonBar className="h-4 w-24" />);
    const bar = container.firstElementChild;

    expect(bar?.className).not.toMatch(/animate-/);
  });

  it("prefers-reduced-motion이 켜져 있어도 모양(클래스)이 그대로다 — 원래 애니메이션이 없다", () => {
    const plain = render(<SkeletonBar className="h-4 w-24" />);
    const plainClassName = plain.container.firstElementChild?.className;
    plain.unmount();

    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;

    const reduced = render(<SkeletonBar className="h-4 w-24" />);

    expect(reduced.container.firstElementChild?.className).toBe(plainClassName);

    window.matchMedia = originalMatchMedia;
  });

  it("전달한 className으로 막대의 크기를 지정할 수 있다", () => {
    const { container } = render(<SkeletonBar className="h-3 w-16" />);
    const bar = container.firstElementChild;

    expect(bar).toHaveClass("h-3");
    expect(bar).toHaveClass("w-16");
  });
});
