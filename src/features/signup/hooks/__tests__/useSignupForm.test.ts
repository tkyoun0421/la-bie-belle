import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

function formDataOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe("useSignupForm", () => {
  it("초기 상태는 pending이 false고 오류가 없다", async () => {
    const { useSignupForm } = await import("@/features/signup/hooks/useSignupForm");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { result } = renderHook(() => useSignupForm(action));

    expect(result.current.pending).toBe(false);
    expect(result.current.state.ok).toBe(true);
    expect(typeof result.current.formAction).toBe("function");
  });

  it("FormData에서 필드를 읽어 action에 전달한다", async () => {
    const { useSignupForm } = await import("@/features/signup/hooks/useSignupForm");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { result } = renderHook(() => useSignupForm(action));

    await act(async () => {
      result.current.formAction(
        formDataOf({
          name: "홍길동",
          phone: "010-1234-5678",
          gender: "male",
          birthDate: "1990-01-01",
        }),
      );
    });

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({
        name: "홍길동",
        phone: "010-1234-5678",
        gender: "male",
        birthDate: "1990-01-01",
      }),
    );
  });

  it("fieldErrors 없는 실패는 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useSignupForm } = await import("@/features/signup/hooks/useSignupForm");
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_PROFILE_EXISTS });

    const { result } = renderHook(() => useSignupForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({}));
    });

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith("이미 가입 절차를 진행했어요"));
  });

  it("fieldErrors가 있으면 스낵바를 띄우지 않는다(인라인 표시로 위임)", async () => {
    const { useSignupForm } = await import("@/features/signup/hooks/useSignupForm");
    const action = vi.fn().mockResolvedValue({
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: { name: "이름을 입력해 주세요" },
    });

    const { result } = renderHook(() => useSignupForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({}));
    });

    await waitFor(() => expect(result.current.state.ok).toBe(false));
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
