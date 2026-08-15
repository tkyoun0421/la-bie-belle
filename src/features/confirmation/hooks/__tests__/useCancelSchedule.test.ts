import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

afterEach(() => {
  vi.clearAllMocks();
});

const VALID_SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";

describe("useCancelSchedule", () => {
  it("초기 상태는 dialog가 닫혀 있고 pending·오류가 없다", async () => {
    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const action = vi.fn().mockResolvedValue({ ok: true, data: { revision: 1 } });

    const { result } = renderHook(() => useCancelSchedule(action));

    expect(result.current.open).toBe(false);
    expect(result.current.pending).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it("openDialog·closeDialog가 open 상태를 바꾸고 오류를 지운다", async () => {
    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const action = vi.fn().mockResolvedValue({ ok: true, data: { revision: 1 } });

    const { result } = renderHook(() => useCancelSchedule(action));

    act(() => result.current.openDialog());
    expect(result.current.open).toBe(true);

    act(() => result.current.closeDialog());
    expect(result.current.open).toBe(false);
  });

  it("cancel이 성공하면 dialog를 닫고 오류를 남기지 않는다", async () => {
    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const action = vi.fn().mockResolvedValue({ ok: true, data: { revision: 4 } });

    const { result } = renderHook(() => useCancelSchedule(action));

    act(() => result.current.openDialog());

    await act(async () => {
      result.current.cancel(VALID_SCHEDULE_ID);
    });

    expect(action).toHaveBeenCalledWith({ scheduleId: VALID_SCHEDULE_ID });
    expect(result.current.open).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it("cancel이 실패하면 dialog는 열린 채로 레지스트리 문구를 errorMessage에 남긴다", async () => {
    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_CANCEL_INVALID_STATUS });

    const { result } = renderHook(() => useCancelSchedule(action));

    act(() => result.current.openDialog());

    await act(async () => {
      result.current.cancel(VALID_SCHEDULE_ID);
    });

    expect(result.current.open).toBe(true);
    expect(result.current.errorMessage).toBe(ERROR_CODES.SCHEDULING_CANCEL_INVALID_STATUS.message);
  });

  it("pending 중에는 true이고 완료되면 false로 돌아간다(버튼 비활성 근거)", async () => {
    let resolvePending: (value: { ok: true; data: { revision: number } }) => void = () => {};
    const pending = new Promise<{ ok: true; data: { revision: number } }>((resolve) => {
      resolvePending = resolve;
    });
    const action = vi.fn().mockReturnValue(pending);

    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const { result } = renderHook(() => useCancelSchedule(action));

    act(() => {
      result.current.cancel(VALID_SCHEDULE_ID);
    });

    await waitFor(() => expect(result.current.pending).toBe(true));

    await act(async () => {
      resolvePending({ ok: true, data: { revision: 1 } });
    });

    await waitFor(() => expect(result.current.pending).toBe(false));
  });

  it("pending 중 재호출은 action을 다시 부르지 않는다(중복 클릭 방지)", async () => {
    let resolvePending: (value: { ok: true; data: { revision: number } }) => void = () => {};
    const pending = new Promise<{ ok: true; data: { revision: number } }>((resolve) => {
      resolvePending = resolve;
    });
    const action = vi.fn().mockReturnValue(pending);

    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const { result } = renderHook(() => useCancelSchedule(action));

    act(() => {
      result.current.cancel(VALID_SCHEDULE_ID);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));

    act(() => {
      result.current.cancel(VALID_SCHEDULE_ID);
    });

    expect(action).toHaveBeenCalledOnce();

    await act(async () => {
      resolvePending({ ok: true, data: { revision: 1 } });
    });
  });

  it("openDialog는 이전 오류를 지운 채로 연다", async () => {
    const { useCancelSchedule } = await import("@/features/confirmation/hooks/useCancelSchedule");
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_CANCEL_INVALID_STATUS });

    const { result } = renderHook(() => useCancelSchedule(action));

    act(() => result.current.openDialog());
    await act(async () => {
      result.current.cancel(VALID_SCHEDULE_ID);
    });
    expect(result.current.errorMessage).not.toBeNull();

    act(() => result.current.closeDialog());
    act(() => result.current.openDialog());

    expect(result.current.errorMessage).toBeNull();
  });
});
