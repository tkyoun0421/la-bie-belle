import { cleanup, render, screen } from "@testing-library/react";
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

describe("PayBlock — 급여 세 행이 눌리는 요소로 잡힌다 (인수 조건 39, home.html:1745·1762·1780)", () => {
  it("지난주·이번 달·누적 세 행이 각각 button 또는 role=button 요소다 — 목적지는 단언하지 않는다", () => {
    render(<PayBlock status="filled" rows={ROWS} reveal={REVEAL} />);

    const lastWeek = screen.getByText("지난주 · 2회 11시간").closest('button, [role="button"]');
    const thisMonth = screen.getByText("8월 · 6회 30시간").closest('button, [role="button"]');
    const yearToDate = screen.getByText("2026년 누적 · 58회").closest('button, [role="button"]');

    expect(lastWeek).not.toBeNull();
    expect(thisMonth).not.toBeNull();
    expect(yearToDate).not.toBeNull();
  });
});
