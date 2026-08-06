import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useApprovalActions", () => {
  it("초기 상태는 dialog가 닫혀 있고 pending이 false다", async () => {
    const { useApprovalActions } = await import("@/features/approval/hooks/useApprovalActions");
    const onApprove = vi.fn().mockResolvedValue({ ok: true });
    const onReject = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApprovalActions(onApprove, onReject));

    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.approvePending).toBe(false);
    expect(result.current.rejectPending).toBe(false);
  });

  it("openDialog·closeDialog가 dialogOpen을 바꾼다", async () => {
    const { useApprovalActions } = await import("@/features/approval/hooks/useApprovalActions");
    const onApprove = vi.fn().mockResolvedValue({ ok: true });
    const onReject = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApprovalActions(onApprove, onReject));

    act(() => result.current.openDialog());
    expect(result.current.dialogOpen).toBe(true);

    act(() => result.current.closeDialog());
    expect(result.current.dialogOpen).toBe(false);
  });

  it("runApprove가 성공하면 스낵바를 띄우지 않는다", async () => {
    const { useApprovalActions } = await import("@/features/approval/hooks/useApprovalActions");
    const onApprove = vi.fn().mockResolvedValue({ ok: true });
    const onReject = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApprovalActions(onApprove, onReject));

    await act(async () => {
      result.current.runApprove();
    });

    expect(onApprove).toHaveBeenCalledOnce();
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("runApprove가 실패하면 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useApprovalActions } = await import("@/features/approval/hooks/useApprovalActions");
    const onApprove = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    const onReject = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApprovalActions(onApprove, onReject));

    await act(async () => {
      result.current.runApprove();
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.COMMON_FORBIDDEN.message),
    );
  });

  it("runReject는 dialog를 닫고 사유를 그대로 전달한다", async () => {
    const { useApprovalActions } = await import("@/features/approval/hooks/useApprovalActions");
    const onApprove = vi.fn().mockResolvedValue({ ok: true });
    const onReject = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApprovalActions(onApprove, onReject));

    act(() => result.current.openDialog());
    expect(result.current.dialogOpen).toBe(true);

    await act(async () => {
      result.current.runReject("서류 미비");
    });

    expect(onReject).toHaveBeenCalledWith("서류 미비");
    expect(result.current.dialogOpen).toBe(false);
  });

  it("runReject가 실패하면 레지스트리 문구로 스낵바를 띄운다", async () => {
    const { useApprovalActions } = await import("@/features/approval/hooks/useApprovalActions");
    const onApprove = vi.fn().mockResolvedValue({ ok: true });
    const onReject = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_ALREADY_PROCESSED });

    const { result } = renderHook(() => useApprovalActions(onApprove, onReject));

    await act(async () => {
      result.current.runReject("");
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.IDENTITY_ALREADY_PROCESSED.message),
    );
  });
});
