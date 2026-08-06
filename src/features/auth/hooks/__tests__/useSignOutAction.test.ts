import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSignOutAction", () => {
  it("초기 상태는 pending이 false다", async () => {
    const { useSignOutAction } = await import("@/features/auth/hooks/useSignOutAction");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useSignOutAction(action));

    expect(result.current.pending).toBe(false);
    expect(typeof result.current.formAction).toBe("function");
  });

  it("action이 실패하면 레지스트리 문구로 오류 안내를 보여준다", async () => {
    const { useSignOutAction } = await import("@/features/auth/hooks/useSignOutAction");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { result } = renderHook(() => useSignOutAction(action));

    await act(async () => {
      result.current.formAction();
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(
        "일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요",
      ),
    );
  });

  it("action이 성공하면 오류 안내를 보여주지 않는다", async () => {
    const { useSignOutAction } = await import("@/features/auth/hooks/useSignOutAction");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useSignOutAction(action));

    await act(async () => {
      result.current.formAction();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });
});
