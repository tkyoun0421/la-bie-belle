import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BottomSheet } from "@/shared/ui/bottom-sheet";

afterEach(cleanup);

describe("BottomSheet", () => {
  it("open이면 제목을 가진 dialog로 렌더된다", () => {
    render(
      <BottomSheet open onOpenChange={() => {}} title="근무지 선택">
        <p>본점</p>
      </BottomSheet>,
    );

    expect(screen.getByRole("dialog", { name: "근무지 선택" })).toBeInTheDocument();
  });

  it("설명 텍스트는 AA 대비를 만족하는 색을 쓴다", () => {
    render(
      <BottomSheet
        open
        onOpenChange={() => {}}
        title="근무지 선택"
        description="선택한 근무지로 배정 요청을 보냅니다."
      >
        <p>본점</p>
      </BottomSheet>,
    );

    const description = screen.getByText("선택한 근무지로 배정 요청을 보냅니다.");
    expect(description).toHaveClass("text-text");
    expect(description).not.toHaveClass("text-text-muted");
  });

  it("open이 아니면 렌더되지 않는다", () => {
    render(
      <BottomSheet open={false} onOpenChange={() => {}} title="근무지 선택">
        <p>본점</p>
      </BottomSheet>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("바깥 영역을 클릭하면 onOpenChange(false)가 호출된다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="근무지 선택">
        <p>본점</p>
      </BottomSheet>,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
