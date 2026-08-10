import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { showSnackbar, SnackbarProvider } from "@/shared/ui/snackbar";

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

describe("Snackbar", () => {
  it("showSnackbar를 호출하면 메시지가 화면에 나타난다", async () => {
    render(<SnackbarProvider />);

    showSnackbar("저장했어요");

    expect(await screen.findByText("저장했어요")).toBeInTheDocument();
  });

  it("action이 있으면 버튼으로 노출되고 클릭하면 onClick이 호출된다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SnackbarProvider />);

    showSnackbar("일정을 취소했어요", { action: { label: "실행 취소", onClick } });

    const actionButton = await screen.findByRole("button", { name: "실행 취소" });
    await user.click(actionButton);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("바텀시트와 함께 떠도 두 라이브러리의 타이밍 대상이 겹치지 않는다", async () => {
    render(
      <>
        <BottomSheet open onOpenChange={() => {}} title="근무지 선택">
          <p>본점</p>
        </BottomSheet>
        <SnackbarProvider />
      </>,
    );

    showSnackbar("저장했어요");
    await screen.findByText("저장했어요");

    const sheets = document.querySelectorAll("[data-vaul-drawer]");
    const toasts = document.querySelectorAll("[data-sonner-toast]");

    expect(sheets.length).toBeGreaterThan(0);
    expect(toasts.length).toBeGreaterThan(0);
    expect(document.querySelectorAll("[data-vaul-drawer][data-sonner-toast]")).toHaveLength(0);
  });
});
