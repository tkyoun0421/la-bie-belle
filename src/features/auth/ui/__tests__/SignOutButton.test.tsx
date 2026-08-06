import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SignOutButton", () => {
  it("클릭하면 전달받은 action을 호출한다", async () => {
    const { SignOutButton } = await import("@/features/auth/ui/SignOutButton");
    const action = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<SignOutButton action={action} />);
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });

  it("action이 실패하면 오류 안내를 보여주고 버튼은 다시 클릭 가능하다", async () => {
    const { SignOutButton } = await import("@/features/auth/ui/SignOutButton");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
    const user = userEvent.setup();

    render(<SignOutButton action={action} />);
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "로그아웃" })).not.toBeDisabled();
  });
});
