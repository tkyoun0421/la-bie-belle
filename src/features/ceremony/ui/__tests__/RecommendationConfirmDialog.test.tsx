import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecommendationConfirmDialog } from "@/features/ceremony/ui/RecommendationConfirmDialog";

afterEach(cleanup);

describe("RecommendationConfirmDialog", () => {
  it("recommendation이 null이면 렌더되지 않는다", () => {
    render(
      <RecommendationConfirmDialog
        recommendation={null}
        currentCheckin="09:00"
        currentCheckout="18:00"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("추천값과 현재값을 견줘 출근·퇴근 변화를 설명한다", () => {
    render(
      <RecommendationConfirmDialog
        recommendation={{ checkin: "08:20", checkout: { time: "19:10", capped: false } }}
        currentCheckin="09:00"
        currentCheckout="18:00"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "예정 시각을 다시 추천할까요?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("출근 09:00 → 08:20 · 퇴근 18:00 → 19:10")).toBeInTheDocument();
  });

  it("현재값이 미설정이면 미설정으로 표시한다", () => {
    render(
      <RecommendationConfirmDialog
        recommendation={{ checkin: "08:20", checkout: { time: "19:10", capped: false } }}
        currentCheckin={null}
        currentCheckout={null}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("출근 미설정 → 08:20 · 퇴근 미설정 → 19:10")).toBeInTheDocument();
  });

  it("추천 출근이 null이면 규칙표가 비어있다는 문구를 담는다", () => {
    render(
      <RecommendationConfirmDialog
        recommendation={{ checkin: null, checkout: { time: "19:10", capped: true } }}
        currentCheckin="09:00"
        currentCheckout="18:00"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "출근 09:00 → 규칙표가 비어 있어 직접 입력이 필요해요 · 퇴근 18:00 → 19:10 (자정 캡)",
      ),
    ).toBeInTheDocument();
  });

  it("반영 버튼을 누르면 onConfirm을 호출한다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <RecommendationConfirmDialog
        recommendation={{ checkin: "08:20", checkout: { time: "19:10", capped: false } }}
        currentCheckin="09:00"
        currentCheckout="18:00"
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "반영" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("유지 버튼을 누르면 onDismiss를 호출한다", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <RecommendationConfirmDialog
        recommendation={{ checkin: "08:20", checkout: { time: "19:10", capped: false } }}
        currentCheckin="09:00"
        currentCheckout="18:00"
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: "유지" }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
