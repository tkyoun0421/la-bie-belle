import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useRoleAction", () => {
  it("초기 상태는 pending이 false다", async () => {
    const { useRoleAction } = await import("@/features/role-management/hooks/useRoleActions");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useRoleAction(action));

    expect(result.current.pending).toBe(false);
    expect(typeof result.current.formAction).toBe("function");
  });

  it("성공하면 스낵바를 띄우지 않는다", async () => {
    const { useRoleAction } = await import("@/features/role-management/hooks/useRoleActions");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useRoleAction(action));

    await act(async () => {
      result.current.formAction();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("실패하면 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useRoleAction } = await import("@/features/role-management/hooks/useRoleActions");
    const action = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { result } = renderHook(() => useRoleAction(action));

    await act(async () => {
      result.current.formAction();
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.COMMON_FORBIDDEN.message),
    );
  });
});
