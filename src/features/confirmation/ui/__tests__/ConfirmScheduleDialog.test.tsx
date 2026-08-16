import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmScheduleDialog } from "@/features/confirmation/ui/ConfirmScheduleDialog";

afterEach(cleanup);

describe("ConfirmScheduleDialog", () => {
  it("열려 있을 때 확정 안내와 확정하기 버튼을 렌더한다", () => {
    render(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[]}
        noManager={[]}
        showClosingNotice={false}
        errorMessage={null}
        pending={false}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "스케줄을 확정할까요?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "확정하기" })).toBeInTheDocument();
  });

  it("모집 마감 안내는 showClosingNotice가 true일 때만 보인다", () => {
    const { rerender } = render(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[]}
        noManager={[]}
        showClosingNotice={false}
        errorMessage={null}
        pending={false}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByText("모집도 함께 마감됩니다")).not.toBeInTheDocument();

    rerender(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[]}
        noManager={[]}
        showClosingNotice
        errorMessage={null}
        pending={false}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText("모집도 함께 마감됩니다")).toBeInTheDocument();
  });

  it("필요 인원 미달·담당자 없음 경고 목록을 렌더한다", () => {
    render(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[
          { positionId: "p1", positionName: "매니저", requiredCount: 2, assignedCount: 1 },
        ]}
        noManager={[{ positionId: "p2", positionName: "축가", traineeCount: 1 }]}
        showClosingNotice={false}
        errorMessage={null}
        pending={false}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("필요 인원 미달")).toBeInTheDocument();
    expect(screen.getByText("매니저 · 필요 2 / 배정 1")).toBeInTheDocument();
    expect(screen.getByText("담당자 없음")).toBeInTheDocument();
    expect(screen.getByText("축가 · 교육 1")).toBeInTheDocument();
  });

  it("errorMessage가 있으면 오류 문구를 보여준다", () => {
    render(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[]}
        noManager={[]}
        showClosingNotice={false}
        errorMessage="예식을 먼저 만들어 주세요"
        pending={false}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("예식을 먼저 만들어 주세요")).toBeInTheDocument();
  });

  it("확정하기 버튼을 누르면 onConfirm을 호출한다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[]}
        noManager={[]}
        showClosingNotice={false}
        errorMessage={null}
        pending={false}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "확정하기" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("pending일 때 버튼 문구가 확정 중으로 바뀐다", () => {
    render(
      <ConfirmScheduleDialog
        open
        onOpenChange={vi.fn()}
        understaffed={[]}
        noManager={[]}
        showClosingNotice={false}
        errorMessage={null}
        pending
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "확정 중" })).toBeInTheDocument();
  });
});
