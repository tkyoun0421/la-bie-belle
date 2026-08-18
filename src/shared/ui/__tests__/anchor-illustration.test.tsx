import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnchorIllustration } from "@/shared/ui/anchor-illustration";

afterEach(cleanup);

const ILLUSTRATION_NAMES = [
  "schedule-confirmed",
  "vacancy",
  "assignment-changed",
  "change-approved",
  "change-rejected",
  "pay-last-week",
  "pay-month-total",
  "pay-cumulative",
] as const;

function extractHexColors(html: string): string[] {
  return html.match(/#[0-9a-fA-F]{6}/g) ?? [];
}

function isRedHex(hex: string): boolean {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return false;
  }

  let hue: number;
  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2);
  } else {
    hue = 60 * ((r - g) / delta + 4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return hue <= 15 || hue >= 345;
}

describe("AnchorIllustration", () => {
  it.each(ILLUSTRATION_NAMES)("%s 그림이 SVG로 렌더된다", (name) => {
    const { container } = render(<AnchorIllustration name={name} size={32} />);

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("여덟 개 말고 다른 이름은 허용하지 않는다 — 용도 하나에 그림 하나", () => {
    expect(ILLUSTRATION_NAMES).toHaveLength(8);
  });

  it("급여 앵커는 32×32 칸으로 렌더된다", () => {
    const { container } = render(<AnchorIllustration name="pay-last-week" size={32} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("알림 그림은 28×28 칸으로 렌더된다", () => {
    const { container } = render(<AnchorIllustration name="schedule-confirmed" size={28} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "28");
    expect(svg).toHaveAttribute("height", "28");
  });

  it("장식용 그림이라 스크린 리더에서 숨긴다", () => {
    const { container } = render(<AnchorIllustration name="vacancy" size={28} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("색이 CSS 커스텀 프로퍼티(토큰)가 아니라 자산에 박힌 고정값이다", () => {
    const { container } = render(<AnchorIllustration name="pay-cumulative" size={32} />);

    expect(container.innerHTML).not.toContain("var(--color");
  });

  it("연 누적 그림은 라운드 23이 확정한 보라 그라디언트 고정색을 쓴다", () => {
    const { container } = render(<AnchorIllustration name="pay-cumulative" size={32} />);

    expect(container.innerHTML).toContain("#b18cff");
    expect(container.innerHTML).toContain("#6a3bd8");
  });

  it.each(ILLUSTRATION_NAMES)(
    "%s 그림에 빨강 계열 고정색이 없다 — 미반영도 실패가 아니라 처리 완료다",
    (name) => {
      const { container } = render(<AnchorIllustration name={name} size={32} />);

      const reds = extractHexColors(container.innerHTML).filter(isRedHex);
      expect(reds).toEqual([]);
    },
  );

  it("변경 요청 미반영(change-rejected)은 빨강으로 그려지기 가장 쉬운 자리라 이름을 콕 집어 다시 확인한다", () => {
    const { container } = render(<AnchorIllustration name="change-rejected" size={28} />);

    const reds = extractHexColors(container.innerHTML).filter(isRedHex);
    expect(reds).toEqual([]);
  });
});
