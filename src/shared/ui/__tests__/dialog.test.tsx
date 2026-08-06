import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "@/shared/ui/dialog";

afterEach(cleanup);

describe("Dialog", () => {
  it("제목과 설명을 가진 dialog로 렌더된다", () => {
    render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="근무를 취소할까요?"
        description="취소하면 되돌릴 수 없어요."
        confirmLabel="취소하기"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole("dialog", { name: "근무를 취소할까요?" })).toBeInTheDocument();
    expect(screen.getByText("취소하면 되돌릴 수 없어요.")).toBeInTheDocument();
  });

  it("기본 포커스는 위험 행동이 아닌 취소 버튼에 놓인다", async () => {
    render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="근무를 취소할까요?"
        confirmLabel="취소하기"
        tone="destructive"
        onConfirm={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
    });
  });

  it("확인 버튼을 누르면 onConfirm이 호출된다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="근무를 취소할까요?"
        confirmLabel="취소하기"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "취소하기" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("destructive tone에서 확인 버튼이 danger 색을 쓴다", () => {
    render(
      <Dialog
        open
        onOpenChange={() => {}}
        title="근무를 취소할까요?"
        confirmLabel="취소하기"
        tone="destructive"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "취소하기" })).toHaveClass("bg-danger");
  });
});
