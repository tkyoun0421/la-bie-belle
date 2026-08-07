import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HourlyWageForm } from "@/features/worker-management/ui/HourlyWageForm";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HourlyWageForm", () => {
  it("저장값이 있으면 그 값을 입력 필드에 채운다", () => {
    render(<HourlyWageForm action={vi.fn()} initialAmount={15000} isDerived={false} />);

    expect(screen.getByLabelText("시급")).toHaveValue(15000);
  });

  it("파생 표기(isDerived)면 기본 시급 금액을 입력 필드에 그대로 보여준다(F-06)", () => {
    render(<HourlyWageForm action={vi.fn()} initialAmount={12000} isDerived />);

    expect(screen.getByLabelText("시급")).toHaveValue(12000);
  });

  it("파생 표기(isDerived)일 때만 기본 시급 적용 중 안내를 보여준다", () => {
    const { rerender } = render(
      <HourlyWageForm action={vi.fn()} initialAmount={12000} isDerived />,
    );
    expect(screen.getByText("기본 시급 적용 중")).toBeInTheDocument();

    rerender(<HourlyWageForm action={vi.fn()} initialAmount={15000} isDerived={false} />);
    expect(screen.queryByText("기본 시급 적용 중")).not.toBeInTheDocument();
  });

  it("저장 버튼을 누르면 action이 호출된다", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<HourlyWageForm action={action} initialAmount={15000} isDerived={false} />);

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
  });
});
