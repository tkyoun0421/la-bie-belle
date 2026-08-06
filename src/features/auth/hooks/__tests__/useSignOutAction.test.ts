import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("action이 실패하면 오류 안내를 보여준다", async () => {
    const { useSignOutAction } = await import("@/features/auth/hooks/useSignOutAction");
    const action = vi.fn().mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useSignOutAction(action));

    await act(async () => {
      result.current.formAction();
    });

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledOnce());
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
