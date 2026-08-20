import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode, Ref } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseAmountRevealResult } from "@/shared/hooks/useAmountReveal";
import type { PayRow } from "@/views/home/model/home-view-model";
import { PayBlock } from "@/views/home/ui/PayBlock";

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

const REVEAL: UseAmountRevealResult = {
  masked: true,
  revealing: false,
  toggle: () => {},
  settle: () => {},
};

const ROWS: readonly PayRow[] = [
  { kind: "last-week", count: 2, hours: 11, amount: 132000 },
  { kind: "this-month", month: 8, count: 6, hours: 30, amount: 360000 },
  { kind: "year-to-date", year: 2026, count: 58, amount: 3744000 },
];

describe("PayBlock — 급여 세 행의 금액이 눌리는 요소로 잡힌다 (F-03로 뒤집음, 인수 조건 39, home.html:1745·1762·1780)", () => {
  it("지난주·이번 달·누적 세 행 안에 각각 진짜 button이 있다 — 행 전체가 아니라 금액만 대화형이다", () => {
    render(<PayBlock status="filled" rows={ROWS} reveal={REVEAL} />);

    const lastWeekRow = screen.getByText("지난주 · 2회 11시간").closest("div");
    const thisMonthRow = screen.getByText("8월 · 6회 30시간").closest("div");
    const yearToDateRow = screen.getByText("2026년 누적 · 58회").closest("div");

    expect(lastWeekRow).not.toBeNull();
    expect(thisMonthRow).not.toBeNull();
    expect(yearToDateRow).not.toBeNull();

    expect(within(lastWeekRow!).getByRole("button", { name: "금액 보기" })).toBeInTheDocument();
    expect(within(thisMonthRow!).getByRole("button", { name: "금액 보기" })).toBeInTheDocument();
    expect(within(yearToDateRow!).getByRole("button", { name: "금액 보기" })).toBeInTheDocument();
  });
});

describe("PayBlock — 행 컨테이너는 대화형이 아니다 (F-03, home.html:1985)", () => {
  it('급여 행 컨테이너에 role="button"도 tabIndex도 없다', () => {
    const { container } = render(<PayBlock status="filled" rows={ROWS} reveal={REVEAL} />);

    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
  });

  it("행 안의 금액 버튼은 여전히 접근 가능한 진짜 버튼이고 누르면 열림 상태가 바뀐다", () => {
    const toggle = vi.fn();
    render(<PayBlock status="filled" rows={ROWS} reveal={{ ...REVEAL, toggle }} />);

    const [amountButton] = screen.getAllByRole("button", { name: "금액 보기" });
    expect(amountButton).toBeInTheDocument();

    fireEvent.click(amountButton!);

    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("행 하나당 대화형 요소가 하나다", () => {
    render(<PayBlock status="filled" rows={ROWS} reveal={REVEAL} />);

    expect(screen.getAllByRole("button")).toHaveLength(ROWS.length);
  });
});
