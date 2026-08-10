import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MotionProvider } from "@/shared/ui/motion-provider";
import { SnackbarProvider } from "@/shared/ui/snackbar";
import { PayView } from "@/views/pay/ui/PayView";
import { PAY_EMPTY_MONTH, PAY_WITH_ITEMS } from "@/views/pay/ui/pay.mock";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;
}

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

function renderPay(
  props: ComponentProps<typeof PayView>,
  wrapper?: (node: ReactNode) => ReactNode,
) {
  const view = <PayView {...props} />;
  return render(<MotionProvider>{wrapper ? wrapper(view) : view}</MotionProvider>);
}

describe("PayView", () => {
  it("이번 달 예상 합계와 예상 문구를 보여주고 급여·정산·지급 단어를 쓰지 않는다", () => {
    const { container } = renderPay(PAY_WITH_ITEMS);

    expect(screen.getByText("502,500원")).toBeInTheDocument();
    expect(
      screen.getByText("예정된 근무 시간으로 계산한 금액이에요. 실제 지급 금액과 다를 수 있어요."),
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain("정산 완료");
    expect(container.textContent).not.toContain("지급 예정");
  });

  it("일반 근무 예상액과 리허설 예상액을 나눠 보여준다", () => {
    renderPay(PAY_WITH_ITEMS);

    expect(screen.getByText("일반 근무").closest("div")).toHaveTextContent("450,000원");
    expect(screen.getByText("리허설").closest("div")).toHaveTextContent("52,500원");
  });

  it("눈 아이콘을 누르면 금액을 숨긴다", async () => {
    const user = userEvent.setup();
    renderPay(PAY_WITH_ITEMS);

    await user.click(screen.getByRole("button", { name: "금액 숨기기" }));

    expect(screen.queryByText("502,500원")).toBeNull();
    expect(screen.getByRole("button", { name: "금액 표시하기" })).toBeInTheDocument();
  });

  it("날짜별 내역에 일반 근무와 리허설 기록을 함께 렌더한다", () => {
    renderPay(PAY_WITH_ITEMS);

    const itemsSection = screen.getByText("날짜별 내역").closest("section")!;
    expect(within(itemsSection).getByText(/2026-08-09/)).toBeInTheDocument();
    expect(within(itemsSection).getByText(/2026-08-11/)).toBeInTheDocument();
  });

  it("빈 달은 내역이 없다는 안내를 보여준다", () => {
    renderPay(PAY_EMPTY_MONTH);

    expect(screen.getByText("이번 달 내역이 아직 없어요")).toBeInTheDocument();
  });

  it("리허설 기록 목록과 공식 기록이 아니라는 안내를 보여준다", () => {
    renderPay(PAY_WITH_ITEMS);

    expect(
      screen.getByText("직접 작성한 참고 기록이며 공식 출퇴근 기록이 아니에요"),
    ).toBeInTheDocument();

    const rehearsalSection = screen.getByText("리허설 기록").closest("section")!;
    expect(within(rehearsalSection).getByText(/2026-08-18/)).toBeInTheDocument();
  });

  it("리허설 기록 추가를 누르면 입력 바텀시트가 열리고 추가하면 목록과 합계에 반영된다", async () => {
    const user = userEvent.setup();
    renderPay(PAY_EMPTY_MONTH);

    await user.click(screen.getByRole("button", { name: "리허설 기록 추가" }));
    await user.type(screen.getByLabelText("날짜"), "2026-08-20");
    await user.type(screen.getByLabelText("시작 시각"), "10:00");
    await user.type(screen.getByLabelText("종료 시각"), "11:00");
    await user.click(screen.getByRole("button", { name: "추가하기" }));

    const rehearsalSection = screen.getByText("리허설 기록").closest("section")!;
    expect(within(rehearsalSection).getByText(/2026-08-20/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("리허설").closest("div")).toHaveTextContent("15,000원"),
    );
  });

  it("기존 기록을 탭하면 수정 바텀시트가 열리고 값을 바꿔 저장하면 목록·합계에 반영된다", async () => {
    const user = userEvent.setup();
    renderPay(PAY_WITH_ITEMS);

    const rehearsalSection = screen.getByText("리허설 기록").closest("section")!;
    await user.click(within(rehearsalSection).getByRole("button", { name: /2026-08-11/ }));

    const sheet = screen.getByRole("dialog");
    const endTimeInput = within(sheet).getByLabelText("종료 시각");
    await user.clear(endTimeInput);
    await user.type(endTimeInput, "16:00");
    await user.click(within(sheet).getByRole("button", { name: "저장하기" }));

    expect(within(rehearsalSection).getByText(/16:00/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("리허설").closest("div")).toHaveTextContent("67,500원"),
    );
  });

  it("수정 바텀시트에서 삭제하면 목록에서 사라지고 되돌리기를 제공한다", async () => {
    const user = userEvent.setup();
    renderPay(PAY_WITH_ITEMS, (view) => (
      <>
        <SnackbarProvider />
        {view}
      </>
    ));

    const rehearsalSection = screen.getByText("리허설 기록").closest("section")!;
    await user.click(within(rehearsalSection).getByRole("button", { name: /2026-08-11/ }));
    const sheet = screen.getByRole("dialog");
    await user.click(within(sheet).getByRole("button", { name: "삭제하기" }));

    expect(within(rehearsalSection).queryByText(/2026-08-11/)).toBeNull();
    expect(await screen.findByRole("button", { name: "되돌리기" })).toBeInTheDocument();
  });
});
