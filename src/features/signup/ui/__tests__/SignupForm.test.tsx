import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SignupForm", () => {
  it("이름·휴대폰·성별·생년월일 입력과 제출 버튼, 동의 문구를 렌더한다", async () => {
    const { SignupForm } = await import("@/features/signup/ui/SignupForm");
    const action = vi.fn().mockResolvedValue({ ok: true });

    render(<SignupForm action={action} />);

    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("휴대폰 번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /성별/ })).toBeInTheDocument();
    expect(screen.getByLabelText("생년월일")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가입 신청하기" })).toBeInTheDocument();
    expect(screen.getByText(/개인정보 처리방침/)).toBeInTheDocument();
  });

  it("모든 필드를 채우고 제출하면 action에 정규화 전 입력 그대로를 전달한다", async () => {
    const { SignupForm } = await import("@/features/signup/ui/SignupForm");
    const action = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<SignupForm action={action} />);

    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("휴대폰 번호"), "01012345678");
    await user.click(screen.getByRole("button", { name: /성별/ }));
    await user.click(screen.getByRole("option", { name: "남성" }));
    const birthDateInput = screen.getByLabelText("생년월일");
    fireEvent.change(birthDateInput, { target: { value: "1990-01-01" } });

    await user.click(screen.getByRole("button", { name: "가입 신청하기" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({
        name: "홍길동",
        phone: "01012345678",
        gender: "male",
        birthDate: "1990-01-01",
      }),
    );
  });

  it("fieldErrors가 있으면 해당 필드 아래 인라인으로 보여준다", async () => {
    const { SignupForm } = await import("@/features/signup/ui/SignupForm");
    const action = vi.fn().mockResolvedValue({
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: { name: "이름을 입력해 주세요" },
    });
    const user = userEvent.setup();

    render(<SignupForm action={action} />);
    await user.click(screen.getByRole("button", { name: "가입 신청하기" }));

    await waitFor(() => expect(screen.getByText("이름을 입력해 주세요")).toBeInTheDocument());
  });
});
