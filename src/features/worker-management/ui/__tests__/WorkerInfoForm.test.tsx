import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkerInfoForm } from "@/features/worker-management/ui/WorkerInfoForm";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const INITIAL_VALUES = {
  name: "김근무",
  phone: "01012345678",
  gender: "male" as const,
  birthDate: "1990-01-01",
};

describe("WorkerInfoForm", () => {
  it("초기값을 각 입력 필드에 채운다", () => {
    render(<WorkerInfoForm action={vi.fn()} initialValues={INITIAL_VALUES} />);

    expect(screen.getByLabelText("이름")).toHaveValue("김근무");
    expect(screen.getByLabelText("휴대폰 번호")).toHaveValue("01012345678");
    expect(screen.getByLabelText("생년월일")).toHaveValue("1990-01-01");
  });

  it("저장 버튼을 누르면 action이 호출된다", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<WorkerInfoForm action={action} initialValues={INITIAL_VALUES} />);

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
  });
});
