import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useWorkerStatusAction", () => {
  it("초기 상태는 dialog가 닫혀 있고 pending이 false다", async () => {
    const { useWorkerStatusAction } =
      await import("@/features/worker-management/hooks/useWorkerStatusAction");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useWorkerStatusAction(action));

    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.pending).toBe(false);
  });

  it("openDialog·closeDialog가 dialogOpen을 바꾼다", async () => {
    const { useWorkerStatusAction } =
      await import("@/features/worker-management/hooks/useWorkerStatusAction");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useWorkerStatusAction(action));

    act(() => result.current.openDialog());
    expect(result.current.dialogOpen).toBe(true);

    act(() => result.current.closeDialog());
    expect(result.current.dialogOpen).toBe(false);
  });

  it("run이 성공하면 dialog를 닫고 스낵바를 띄우지 않는다", async () => {
    const { useWorkerStatusAction } =
      await import("@/features/worker-management/hooks/useWorkerStatusAction");
    const action = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useWorkerStatusAction(action));

    act(() => result.current.openDialog());

    await act(async () => {
      result.current.run();
    });

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.dialogOpen).toBe(false);
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("run이 실패하면 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useWorkerStatusAction } =
      await import("@/features/worker-management/hooks/useWorkerStatusAction");
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_STATUS_CONFLICT });

    const { result } = renderHook(() => useWorkerStatusAction(action));

    await act(async () => {
      result.current.run();
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.IDENTITY_STATUS_CONFLICT.message),
    );
  });
});
