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

describe("useOwnPhoneForm", () => {
  it("초기 상태는 pending이 false고 오류가 없다", async () => {
    const { useOwnPhoneForm } = await import("@/features/my-profile/hooks/useOwnPhoneForm");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useOwnPhoneForm(action));

    expect(result.current.pending).toBe(false);
    expect(result.current.state.ok).toBe(true);
  });

  it("FormData의 phone을 action에 전달한다", async () => {
    const { useOwnPhoneForm } = await import("@/features/my-profile/hooks/useOwnPhoneForm");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useOwnPhoneForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({ phone: "010-1234-5678" }));
    });

    await waitFor(() => expect(action).toHaveBeenCalledWith("010-1234-5678"));
  });

  it("fieldErrors 없는 실패는 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useOwnPhoneForm } = await import("@/features/my-profile/hooks/useOwnPhoneForm");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });

    const { result } = renderHook(() => useOwnPhoneForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({ phone: "01012345678" }));
    });

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith("승인 후 이용할 수 있어요"));
  });

  it("fieldErrors가 있으면 스낵바를 띄우지 않는다", async () => {
    const { useOwnPhoneForm } = await import("@/features/my-profile/hooks/useOwnPhoneForm");
    const action = vi.fn().mockResolvedValue({
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: { phone: "휴대폰 번호 형식이 올바르지 않아요" },
    });

    const { result } = renderHook(() => useOwnPhoneForm(action));

    await act(async () => {
      result.current.formAction(formDataOf({ phone: "invalid" }));
    });

    await waitFor(() => expect(result.current.state.ok).toBe(false));
    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
