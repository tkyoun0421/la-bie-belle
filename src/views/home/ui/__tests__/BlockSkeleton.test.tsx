import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BlockSkeleton } from "@/views/home/ui/BlockSkeleton";

afterEach(cleanup);

describe("BlockSkeleton — 이번 주는 아는 값을 안 가린다 (인수 조건 8·39, 라운드 37 결함표, home.html:2847-2867)", () => {
  it("오늘이 속한 주의 요일·날짜 숫자를 실제 글자로 보여준다 — 화요일 2026-08-18은 월 17일~일 23일이 속한 주다", () => {
    render(<BlockSkeleton block="week" todayLabel="8월 18일 화요일" today="2026-08-18" />);

    expect(screen.getByText("월")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("화")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("일")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });

  it("날짜 숫자를 회색 막대(bg-border)로 가리지 않는다", () => {
    render(<BlockSkeleton block="week" todayLabel="8월 18일 화요일" today="2026-08-18" />);

    expect(screen.getByText("17")).not.toHaveClass("bg-border");
  });

  it("달을 넘는 주에서도 실제 요일·날짜를 보여준다 — 8/31(월)이 9월 첫 주에 든다", () => {
    render(<BlockSkeleton block="week" todayLabel="9월 3일 목요일" today="2026-09-03" />);

    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("해를 넘는 주에서도 실제 요일·날짜를 보여준다 — 12/28(월)이 다음 해 첫 주로 이어진다", () => {
    render(<BlockSkeleton block="week" todayLabel="12월 30일 수요일" today="2026-12-30" />);

    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
