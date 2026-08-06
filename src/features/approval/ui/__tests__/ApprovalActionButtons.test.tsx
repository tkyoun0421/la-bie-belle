import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApprovalActionButtons } from "@/features/approval/ui/ApprovalActionButtons";

afterEach(cleanup);

describe("ApprovalActionButtons", () => {
  it("승인·거절 버튼을 렌더한다", () => {
    render(<ApprovalActionButtons onApprove={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByRole("button", { name: "승인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "거절" })).toBeInTheDocument();
  });

  it("승인 버튼을 누르면 onApprove를 호출한다", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn().mockResolvedValue({ ok: true });
    render(<ApprovalActionButtons onApprove={onApprove} onReject={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "승인" }));

    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("거절 버튼을 누르면 사유 다이얼로그가 열리고 확정하면 onReject를 호출한다", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn().mockResolvedValue({ ok: true });
    render(<ApprovalActionButtons onApprove={vi.fn()} onReject={onReject} />);

    await user.click(screen.getByRole("button", { name: "거절" }));
    expect(screen.getByLabelText("거절 사유(선택)")).toBeInTheDocument();

    await user.type(screen.getByLabelText("거절 사유(선택)"), "서류 미비");
    await user.click(screen.getByRole("button", { name: "거절하기" }));

    expect(onReject).toHaveBeenCalledWith("서류 미비");
  });
});
