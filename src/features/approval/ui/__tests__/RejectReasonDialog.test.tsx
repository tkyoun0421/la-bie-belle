import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RejectReasonDialog } from "@/features/approval/ui/RejectReasonDialog";

afterEach(cleanup);

describe("RejectReasonDialog", () => {
  it("열려 있으면 사유 입력 필드를 렌더한다", () => {
    render(<RejectReasonDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByLabelText("거절 사유(선택)")).toBeInTheDocument();
  });

  it("확정을 누르면 입력한 사유로 onConfirm을 호출한다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RejectReasonDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText("거절 사유(선택)"), "서류 미비");
    await user.click(screen.getByRole("button", { name: "거절하기" }));

    expect(onConfirm).toHaveBeenCalledWith("서류 미비");
  });

  it("사유를 입력하지 않아도 빈 문자열로 onConfirm을 호출한다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RejectReasonDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "거절하기" }));

    expect(onConfirm).toHaveBeenCalledWith("");
  });
});
