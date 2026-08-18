import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { UseAmountRevealResult } from "@/shared/hooks/useAmountReveal";
import type { WeekFooter, WeekStripCell } from "@/views/home/model/week-strip";
import { WeekStripBlock } from "@/views/home/ui/WeekStripBlock";

afterEach(cleanup);

const REVEAL: UseAmountRevealResult = {
  masked: true,
  revealing: false,
  toggle: () => {},
  settle: () => {},
};

const FOOTER: WeekFooter = { caption: "주급 · 2회 10시간", amount: null };

const CELLS: readonly WeekStripCell[] = [
  { date: "2026-08-17", weekdayLabel: "월", dayNumber: 17, hasShift: true },
  { date: "2026-08-18", weekdayLabel: "화", dayNumber: 18, hasShift: false },
  { date: "2026-08-19", weekdayLabel: "수", dayNumber: 19, hasShift: true },
  { date: "2026-08-20", weekdayLabel: "목", dayNumber: 20, hasShift: false },
  { date: "2026-08-21", weekdayLabel: "금", dayNumber: 21, hasShift: false },
  { date: "2026-08-22", weekdayLabel: "토", dayNumber: 22, hasShift: true },
  { date: "2026-08-23", weekdayLabel: "일", dayNumber: 23, hasShift: false },
];

describe("WeekStripBlock — 주 셀 선택 스쿼시 (인수 조건 39, 라운드 38 #10, home.html:698-721)", () => {
  it("선택된 셀의 날짜 숫자에만 selectIn 모션 클래스가 걸리고, 근무 없는 셀은 애초에 고를 수 없다", () => {
    render(
      <WeekStripBlock
        status="filled"
        cells={CELLS}
        today="2026-08-18"
        footer={FOOTER}
        selectedDate="2026-08-17"
        onSelect={() => {}}
        reveal={REVEAL}
      />,
    );

    expect(screen.getByText("17")).toHaveClass("motion-select-in");
    expect(screen.getByText("19")).not.toHaveClass("motion-select-in");
    expect(screen.getByText("18").closest("button")).toBeDisabled();
  });

  it("선택이 다른 셀로 옮겨가면 모션 클래스도 함께 옮겨간다", () => {
    const { rerender } = render(
      <WeekStripBlock
        status="filled"
        cells={CELLS}
        today="2026-08-18"
        footer={FOOTER}
        selectedDate="2026-08-17"
        onSelect={() => {}}
        reveal={REVEAL}
      />,
    );

    expect(screen.getByText("17")).toHaveClass("motion-select-in");

    rerender(
      <WeekStripBlock
        status="filled"
        cells={CELLS}
        today="2026-08-18"
        footer={FOOTER}
        selectedDate="2026-08-22"
        onSelect={() => {}}
        reveal={REVEAL}
      />,
    );

    expect(screen.getByText("22")).toHaveClass("motion-select-in");
    expect(screen.getByText("17")).not.toHaveClass("motion-select-in");
  });
});
