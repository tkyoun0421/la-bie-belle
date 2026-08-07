import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OwnWageForm } from "@/features/my-profile/ui/OwnWageForm";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OwnWageForm", () => {
  it("초기 시급값을 입력 필드에 채운다", () => {
    render(<OwnWageForm action={vi.fn()} initialHourlyWage={13000} isDerived={false} />);

    expect(screen.getByLabelText("시급")).toHaveValue(13000);
  });

  it("파생 표기(isDerived)면 기본 시급 적용 중 안내를 보여준다", () => {
    render(<OwnWageForm action={vi.fn()} initialHourlyWage={null} isDerived />);

    expect(screen.getByText("기본 시급 적용 중")).toBeInTheDocument();
  });

  it("파생 표기가 아니면 안내를 보여주지 않는다", () => {
    render(<OwnWageForm action={vi.fn()} initialHourlyWage={13000} isDerived={false} />);

    expect(screen.queryByText("기본 시급 적용 중")).not.toBeInTheDocument();
  });

  it("저장 버튼을 누르면 action이 호출된다", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<OwnWageForm action={action} initialHourlyWage={13000} isDerived={false} />);

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
  });
});
