import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import { SnackbarProvider } from "@/shared/ui/snackbar";
import { ScheduleView } from "@/views/schedule/ui/ScheduleView";
import { SCHEDULE_EMPTY_MONTH, SCHEDULE_MIXED_MONTH } from "@/views/schedule/ui/schedule.mock";

const SEPTEMBER_SCHEDULES: RecruitmentScheduleWithApplication[] = [
  {
    id: "schedule-2026-09-05",
    workDate: "2026-09-05",
    applicationDeadline: "2026-09-05",
    status: "OPEN",
    applicationStatus: "applied",
  },
];

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("ScheduleView", () => {
  it("모집 없음·모집 중·신청 완료·모집 마감·확정 상태를 달력에 렌더한다", () => {
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} />);

    expect(screen.getByRole("button", { name: "8월 1일 모집 없음" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 3일 신청 가능" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 4일 신청" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 2일 마감" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 7일 확정" })).toBeInTheDocument();
  });

  it("모집 중인 날짜를 탭하면 로컬 선택 상태로 바뀐다", async () => {
    const user = userEvent.setup();
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} />);

    await user.click(screen.getByRole("button", { name: "8월 3일 신청 가능" }));

    expect(screen.getByRole("button", { name: "8월 3일 선택됨" })).toBeInTheDocument();
  });

  it("마감·확정 날짜를 탭하면 상세 라우트로 이동하고 선택 상태를 바꾸지 않는다", async () => {
    const user = userEvent.setup();
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} />);

    await user.click(screen.getByRole("button", { name: "8월 7일 확정" }));

    expect(push).toHaveBeenCalledWith("/schedule/2026-08-07");
    expect(screen.getByRole("button", { name: "8월 7일 확정" })).toBeInTheDocument();
  });

  it("변경 개수를 하단에 표시하고 저장하면 스낵바와 되돌리기를 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SnackbarProvider />
        <ScheduleView {...SCHEDULE_MIXED_MONTH} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "8월 3일 신청 가능" }));
    expect(screen.getByText("1개 변경")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "신청하기" }));

    expect(await screen.findByText("근무 가능일을 변경했어요")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "방금 변경한 1개 날짜 되돌리기" }),
    ).toBeInTheDocument();
  });

  it("빈 월은 신청 가능한 날짜 없이 렌더된다", () => {
    render(<ScheduleView {...SCHEDULE_EMPTY_MONTH} />);

    expect(screen.queryByRole("button", { name: /신청 가능/ })).toBeNull();
  });

  it("월을 이동하면 month searchParam으로 라우팅한다", async () => {
    const user = userEvent.setup();
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} />);

    await user.click(screen.getByRole("button", { name: "다음 달로 이동" }));

    expect(push).toHaveBeenCalledWith("/schedule?month=2026-09");
  });

  it("월을 이동했다가 돌아오면 새 달의 신청 상태가 반영되고 이전 달의 미저장 선택도 유지된다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ScheduleView {...SCHEDULE_MIXED_MONTH} />);

    await user.click(screen.getByRole("button", { name: "8월 3일 신청 가능" }));
    expect(screen.getByRole("button", { name: "8월 3일 선택됨" })).toBeInTheDocument();

    rerender(
      <ScheduleView
        month="2026-09"
        today="2026-08-01"
        schedules={SEPTEMBER_SCHEDULES}
        onApply={SCHEDULE_MIXED_MONTH.onApply}
      />,
    );

    expect(screen.getByRole("button", { name: "9월 5일 신청" })).toBeInTheDocument();

    rerender(<ScheduleView {...SCHEDULE_MIXED_MONTH} />);

    expect(screen.getByRole("button", { name: "8월 3일 선택됨" })).toBeInTheDocument();
  });
});
