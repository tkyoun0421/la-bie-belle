import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CeremonyGenerateForm } from "@/features/ceremony/ui/CeremonyGenerateForm";

afterEach(cleanup);

describe("CeremonyGenerateForm", () => {
  it("기본값(개수 1·첫 예식 10:00)으로 렌더한다", () => {
    render(<CeremonyGenerateForm onGenerate={vi.fn()} />);

    expect(screen.getByLabelText("예식 개수")).toHaveValue(1);
    expect(screen.getByLabelText("첫 예식 시각")).toHaveValue("10:00");
  });

  it("기본값 그대로 제출하면 onGenerate를 1, 10:00으로 호출한다", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    render(<CeremonyGenerateForm onGenerate={onGenerate} />);

    await user.click(screen.getByRole("button", { name: "예식 목록 생성" }));

    expect(onGenerate).toHaveBeenCalledWith(1, "10:00");
  });

  it("개수와 첫 예식 시각을 바꿔 제출하면 바뀐 값으로 onGenerate를 호출한다", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    render(<CeremonyGenerateForm onGenerate={onGenerate} />);

    const countInput = screen.getByLabelText("예식 개수");
    await user.clear(countInput);
    await user.type(countInput, "4");

    const timeInput = screen.getByLabelText("첫 예식 시각");
    fireEvent.change(timeInput, { target: { value: "11:30" } });

    await user.click(screen.getByRole("button", { name: "예식 목록 생성" }));

    expect(onGenerate).toHaveBeenCalledWith(4, "11:30");
  });
});
