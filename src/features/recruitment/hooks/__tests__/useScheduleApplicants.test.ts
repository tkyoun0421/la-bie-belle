import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

afterEach(() => {
  vi.clearAllMocks();
});

describe("useScheduleApplicants", () => {
  it("초기 상태는 applicants가 null이고 loading·failed가 false다", async () => {
    const { useScheduleApplicants } =
      await import("@/features/recruitment/hooks/useScheduleApplicants");
    const onList = vi.fn();

    const { result } = renderHook(() => useScheduleApplicants(onList));

    expect(result.current.applicants).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it("load를 호출하면 loading이 true였다가 성공 시 applicants를 채운다", async () => {
    const { useScheduleApplicants } =
      await import("@/features/recruitment/hooks/useScheduleApplicants");
    const onList = vi.fn().mockResolvedValue({ ok: true, applicants: [{ name: "김민준" }] });

    const { result } = renderHook(() => useScheduleApplicants(onList));

    act(() => {
      result.current.load("schedule-1");
    });

    expect(result.current.loading).toBe(true);
    expect(onList).toHaveBeenCalledWith({ scheduleId: "schedule-1" });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.applicants).toEqual([{ name: "김민준" }]);
    expect(result.current.failed).toBe(false);
  });

  it("조회가 실패하면 failed를 true로 두고 applicants는 null로 남긴다", async () => {
    const { useScheduleApplicants } =
      await import("@/features/recruitment/hooks/useScheduleApplicants");
    const onList = vi.fn().mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { result } = renderHook(() => useScheduleApplicants(onList));

    await act(async () => {
      result.current.load("schedule-1");
    });

    expect(result.current.failed).toBe(true);
    expect(result.current.applicants).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("느린 첫 요청보다 뒤이은 두 번째 요청이 먼저 끝나도 최신 요청 결과만 반영한다", async () => {
    const { useScheduleApplicants } =
      await import("@/features/recruitment/hooks/useScheduleApplicants");
    let resolveFirst: (value: unknown) => void = () => {};
    const first = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const onList = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({ ok: true, applicants: [{ name: "이서연" }] });

    const { result } = renderHook(() => useScheduleApplicants(onList));

    act(() => {
      result.current.load("schedule-1");
    });
    await act(async () => {
      result.current.load("schedule-2");
    });

    await waitFor(() => expect(result.current.applicants).toEqual([{ name: "이서연" }]));

    await act(async () => {
      resolveFirst({ ok: true, applicants: [{ name: "김민준" }] });
    });

    expect(result.current.applicants).toEqual([{ name: "이서연" }]);
  });

  it("reset을 호출하면 상태를 초기화하고 지연 중이던 이전 요청 결과를 무시한다", async () => {
    const { useScheduleApplicants } =
      await import("@/features/recruitment/hooks/useScheduleApplicants");
    let resolvePending: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolvePending = resolve;
    });
    const onList = vi.fn().mockReturnValue(pending);

    const { result } = renderHook(() => useScheduleApplicants(onList));

    act(() => {
      result.current.load("schedule-1");
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.applicants).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(false);

    await act(async () => {
      resolvePending({ ok: true, applicants: [{ name: "김민준" }] });
    });

    expect(result.current.applicants).toBeNull();
  });
});
