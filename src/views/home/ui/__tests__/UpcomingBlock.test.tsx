import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode, Ref } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UpcomingShift } from "@/views/home/model/upcoming-shifts";
import { UpcomingBlock } from "@/views/home/ui/UpcomingBlock";

vi.mock("next/link", () => ({
  default: ({
    href,
    transitionTypes,
    children,
    ref,
    ...rest
  }: {
    href: string;
    transitionTypes?: string[];
    children: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
  }) => (
    <a href={href} ref={ref} data-transition-types={transitionTypes?.join(",")} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const SHIFT: UpcomingShift = {
  date: "2026-08-19",
  position: "접수",
  startTime: "10:00",
  endTime: "15:00",
  daysUntil: 1,
  label: "D-1",
  tier: "d1",
};

describe("UpcomingBlock — 행·알약 눌림 스쿼시 (인수 조건 39, 라운드 38 #12·#13, home.html:804-816·910-926)", () => {
  it("행 전체에 .985, 확인 알약에 .94 배율의 눌림 피드백을 토큰 시간·이징으로 건다", () => {
    render(<UpcomingBlock status="filled" shifts={[SHIFT]} />);

    const row = screen.getByText("8월 19일 수").closest("a");
    expect(row).not.toBeNull();
    expect(row?.className).toContain("active:scale-[0.985]");
    expect(row?.className).toContain("duration-[var(--duration-feedback)]");
    expect(row?.className).toContain("ease-[var(--ease-out)]");
    expect(row?.getAttribute("style") ?? "").not.toMatch(/\d+m?s/);

    const pill = screen.getByText("확인");
    expect(pill.className).toContain("active:scale-[0.94]");
    expect(pill.className).toContain("duration-[var(--duration-feedback)]");
    expect(pill.className).toContain("ease-[var(--ease-out)]");
    expect(pill.getAttribute("style") ?? "").not.toMatch(/\d+m?s/);
  });
});
