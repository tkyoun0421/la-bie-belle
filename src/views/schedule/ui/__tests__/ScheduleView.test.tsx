import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SnackbarProvider } from "@/shared/ui/snackbar";
import { ScheduleView } from "@/views/schedule/ui/ScheduleView";
import { SCHEDULE_EMPTY_MONTH, SCHEDULE_MIXED_MONTH } from "@/views/schedule/ui/schedule.mock";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

afterEach(cleanup);

describe("ScheduleView", () => {
  it("모집 없음·모집 중·신청 완료·모집 마감·확정 상태를 달력에 렌더한다", () => {
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} onOpenDetail={() => {}} />);

    expect(screen.getByRole("button", { name: "8월 1일 모집 없음" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 3일 신청 가능" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 4일 신청" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 2일 마감" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8월 7일 확정" })).toBeInTheDocument();
  });

  it("모집 중인 날짜를 탭하면 로컬 선택 상태로 바뀐다", async () => {
    const user = userEvent.setup();
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} onOpenDetail={() => {}} />);

    await user.click(screen.getByRole("button", { name: "8월 3일 신청 가능" }));

    expect(screen.getByRole("button", { name: "8월 3일 선택됨" })).toBeInTheDocument();
  });

  it("마감·확정 날짜를 탭하면 상세 열기를 호출하고 선택 상태를 바꾸지 않는다", async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    render(<ScheduleView {...SCHEDULE_MIXED_MONTH} onOpenDetail={onOpenDetail} />);

    await user.click(screen.getByRole("button", { name: "8월 7일 확정" }));

    expect(onOpenDetail).toHaveBeenCalledWith("2026-08-07");
    expect(screen.getByRole("button", { name: "8월 7일 확정" })).toBeInTheDocument();
  });

  it("변경 개수를 하단에 표시하고 저장하면 스낵바와 되돌리기를 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SnackbarProvider />
        <ScheduleView {...SCHEDULE_MIXED_MONTH} onOpenDetail={() => {}} />
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
    render(<ScheduleView {...SCHEDULE_EMPTY_MONTH} onOpenDetail={() => {}} />);

    expect(screen.queryByRole("button", { name: /신청 가능/ })).toBeNull();
  });
});
