import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HourlyWageForm } from "@/features/worker-management/ui/HourlyWageForm";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("HourlyWageForm", () => {
  it("초기 시급값을 입력 필드에 채운다", () => {
    render(<HourlyWageForm action={vi.fn()} initialHourlyWage={15000} isDerived={false} />);

    expect(screen.getByLabelText("시급")).toHaveValue(15000);
  });

  it("초기 시급이 없으면 입력 필드가 비어 있다", () => {
    render(<HourlyWageForm action={vi.fn()} initialHourlyWage={null} isDerived />);

    expect(screen.getByLabelText("시급")).toHaveValue(null);
  });

  it("파생 표기(isDerived)일 때만 기본 시급 적용 중 안내를 보여준다", () => {
    const { rerender } = render(
      <HourlyWageForm action={vi.fn()} initialHourlyWage={null} isDerived />,
    );
    expect(screen.getByText("기본 시급 적용 중")).toBeInTheDocument();

    rerender(<HourlyWageForm action={vi.fn()} initialHourlyWage={15000} isDerived={false} />);
    expect(screen.queryByText("기본 시급 적용 중")).not.toBeInTheDocument();
  });

  it("저장 버튼을 누르면 action이 호출된다", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<HourlyWageForm action={action} initialHourlyWage={15000} isDerived={false} />);

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
  });
});
