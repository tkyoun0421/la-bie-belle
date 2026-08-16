import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CancelScheduleDialog } from "@/features/confirmation/ui/CancelScheduleDialog";

afterEach(cleanup);

describe("CancelScheduleDialog", () => {
  it("영향받는 인원 수를 안내에 담아 렌더한다", () => {
    render(
      <CancelScheduleDialog
        open
        onOpenChange={vi.fn()}
        affectedWorkerCount={3}
        errorMessage={null}
        pending={false}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "스케줄을 취소할까요?" })).toBeInTheDocument();
    expect(
      screen.getByText("배정된 3명에게 영향이 가요. 취소 후에는 되돌릴 수 없어요"),
    ).toBeInTheDocument();
  });

  it("errorMessage가 있으면 오류 문구를 보여준다", () => {
    render(
      <CancelScheduleDialog
        open
        onOpenChange={vi.fn()}
        affectedWorkerCount={0}
        errorMessage="취소할 수 없는 상태예요"
        pending={false}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("취소할 수 없는 상태예요")).toBeInTheDocument();
  });

  it("취소하기 버튼을 누르면 onCancel을 호출한다", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <CancelScheduleDialog
        open
        onOpenChange={vi.fn()}
        affectedWorkerCount={1}
        errorMessage={null}
        pending={false}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "취소하기" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("pending일 때 버튼 문구가 취소하는 중으로 바뀐다", () => {
    render(
      <CancelScheduleDialog
        open
        onOpenChange={vi.fn()}
        affectedWorkerCount={1}
        errorMessage={null}
        pending
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "취소하는 중" })).toBeInTheDocument();
  });
});
