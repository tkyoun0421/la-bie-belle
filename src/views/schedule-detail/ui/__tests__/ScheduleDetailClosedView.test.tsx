import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScheduleDetailClosedView } from "@/views/schedule-detail/ui/ScheduleDetailClosedView";

afterEach(cleanup);

describe("ScheduleDetailClosedView", () => {
  it("근무일과 마감 상태를 보여준다", () => {
    render(<ScheduleDetailClosedView workDate="2026-08-20" ownApplicationStatus={null} />);

    expect(screen.getByText("2026-08-20")).toBeInTheDocument();
    expect(screen.getAllByText("모집 마감").length).toBeGreaterThan(0);
  });

  it("applied면 신청 완료와 확정 대기 안내를 보여준다", () => {
    render(<ScheduleDetailClosedView workDate="2026-08-20" ownApplicationStatus="applied" />);

    expect(screen.getByText("신청 완료")).toBeInTheDocument();
    expect(
      screen.getByText("포지션 배정 확정을 기다리고 있어요. 확정되면 스케줄에서 알려드릴게요."),
    ).toBeInTheDocument();
  });

  it("신청 기록이 없으면 미신청을 보여준다", () => {
    render(<ScheduleDetailClosedView workDate="2026-08-20" ownApplicationStatus={null} />);

    expect(screen.getByText("미신청")).toBeInTheDocument();
  });

  it("철회 상태도 미신청으로 취급한다(경계값)", () => {
    render(<ScheduleDetailClosedView workDate="2026-08-20" ownApplicationStatus="withdrawn" />);

    expect(screen.getByText("미신청")).toBeInTheDocument();
  });

  it("배정표나 다른 근무자의 개인정보를 렌더하지 않는다", () => {
    const { container } = render(
      <ScheduleDetailClosedView workDate="2026-08-20" ownApplicationStatus="applied" />,
    );

    expect(container.textContent).not.toMatch(/\d{3}-\d{4}-\d{4}/);
    expect(screen.queryByText("전체 배정표")).toBeNull();
  });
});
