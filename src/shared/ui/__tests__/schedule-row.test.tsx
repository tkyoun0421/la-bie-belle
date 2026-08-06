import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScheduleRow } from "@/shared/ui/schedule-row";

afterEach(cleanup);

describe("ScheduleRow", () => {
  it("접근 가능한 이름에 날짜와 상태를 포함한다", () => {
    render(
      <ScheduleRow
        date={new Date(2026, 7, 3)}
        scheduledStart="09:00"
        scheduledEnd="18:00"
        position="플로어"
        status="확정"
        onPress={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /8월 3일/ })).toHaveAccessibleName(/확정/);
  });

  it("예정 출퇴근·포지션·상태를 표시한다", () => {
    render(
      <ScheduleRow
        date={new Date(2026, 7, 3)}
        scheduledStart="09:00"
        scheduledEnd="18:00"
        position="플로어"
        status="확정"
        onPress={() => {}}
      />,
    );

    const timeRange = screen.getByText("09:00 - 18:00");
    expect(timeRange).toBeInTheDocument();
    expect(timeRange).toHaveClass("text-text");
    expect(timeRange).not.toHaveClass("text-text-muted");

    expect(screen.getByText("플로어")).toBeInTheDocument();

    const status = screen.getByText("확정");
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass("text-text");
    expect(status).not.toHaveClass("text-text-muted");
  });

  it("접근 가능한 이름에 예정 출퇴근과 포지션도 포함된다(aria-label이 콘텐츠를 덮지 않는다)", () => {
    render(
      <ScheduleRow
        date={new Date(2026, 7, 3)}
        scheduledStart="09:00"
        scheduledEnd="18:00"
        position="플로어"
        status="확정"
        onPress={() => {}}
      />,
    );

    const button = screen.getByRole("button", { name: /8월 3일/ });
    expect(button).toHaveAccessibleName(/09:00/);
    expect(button).toHaveAccessibleName(/18:00/);
    expect(button).toHaveAccessibleName(/플로어/);
  });

  it("본인과 관련된 변경 설명을 보여준다", () => {
    render(
      <ScheduleRow
        date={new Date(2026, 7, 3)}
        scheduledStart="09:00"
        scheduledEnd="18:00"
        position="플로어"
        status="변경됨"
        changeNote="시작 시간이 30분 당겨졌어요"
        onPress={() => {}}
      />,
    );

    expect(screen.getByText("시작 시간이 30분 당겨졌어요")).toHaveClass("text-action");
  });

  it("행을 탭하면 onPress가 호출된다", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <ScheduleRow
        date={new Date(2026, 7, 3)}
        scheduledStart="09:00"
        scheduledEnd="18:00"
        position="플로어"
        status="확정"
        onPress={onPress}
      />,
    );

    await user.click(screen.getByRole("button", { name: /8월 3일/ }));

    expect(onPress).toHaveBeenCalledOnce();
  });
});
