import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OwnPhoneForm } from "@/features/my-profile/ui/OwnPhoneForm";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OwnPhoneForm", () => {
  it("초기 휴대폰 번호를 입력 필드에 채운다", () => {
    render(<OwnPhoneForm action={vi.fn()} initialPhone="01012345678" />);

    expect(screen.getByLabelText("휴대폰 번호")).toHaveValue("01012345678");
  });

  it("저장 버튼을 누르면 action이 호출된다", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<OwnPhoneForm action={action} initialPhone="01012345678" />);

    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
  });
});
