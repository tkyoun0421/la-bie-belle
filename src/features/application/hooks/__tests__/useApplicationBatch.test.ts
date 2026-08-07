import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

const SCHEDULES = [
  {
    id: "schedule-open",
    workDate: "2099-09-01",
    applicationDeadline: "2099-09-01",
    status: "OPEN" as const,
    applicationStatus: null,
  },
  {
    id: "schedule-applied",
    workDate: "2099-09-02",
    applicationDeadline: "2099-09-02",
    status: "OPEN" as const,
    applicationStatus: "applied" as const,
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe("useApplicationBatch", () => {
  it("초기 savedApplied·pending은 applicationStatus가 applied인 날짜만 포함한다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn();

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    expect(result.current.savedApplied).toEqual(new Set(["2099-09-02"]));
    expect(result.current.pending).toEqual(new Set(["2099-09-02"]));
    expect(result.current.changeCount).toBe(0);
    expect(result.current.undo).toBeNull();
  });

  it("toggle은 pending을 바꾸고 기존 undo 메모리를 지운다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn();

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    act(() => {
      result.current.toggle("2099-09-01");
    });

    expect(result.current.pending).toEqual(new Set(["2099-09-01", "2099-09-02"]));
    expect(result.current.changeCount).toBe(1);
  });

  it("save 성공 시 savedApplied를 갱신하고 스낵바와 되돌리기 메모리를 남긴다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({ ok: true, appliedCount: 1, withdrawnCount: 0 });

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    act(() => {
      result.current.toggle("2099-09-01");
    });
    await act(async () => {
      result.current.save();
    });

    expect(onApply).toHaveBeenCalledWith({
      applyScheduleIds: ["schedule-open"],
      withdrawScheduleIds: [],
    });
    expect(result.current.savedApplied).toEqual(new Set(["2099-09-01", "2099-09-02"]));
    expect(result.current.changeCount).toBe(0);
    expect(showSnackbar).toHaveBeenCalledWith("근무 가능일을 변경했어요");
    expect(result.current.undo?.count).toBe(1);
    expect(typeof result.current.undo?.execute).toBe("function");
  });

  it("save 실패 시 로컬 선택을 보존하고 되돌리기 메모리를 만들지 않는다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({
      ok: false,
      code: ERROR_CODE.SCHEDULING_APPLICATION_BLOCKED,
      blockedDates: ["2099-09-01"],
    });

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    act(() => {
      result.current.toggle("2099-09-01");
    });
    await act(async () => {
      result.current.save();
    });

    expect(result.current.pending).toEqual(new Set(["2099-09-01", "2099-09-02"]));
    expect(result.current.savedApplied).toEqual(new Set(["2099-09-02"]));
    expect(result.current.undo).toBeNull();
    expect(showSnackbar).toHaveBeenCalledWith(
      `${ERROR_CODES.SCHEDULING_APPLICATION_BLOCKED.message} (2099-09-01)`,
    );
  });

  it("되돌리기를 실행하면 반대 방향 batch를 같은 경로로 제출한다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({ ok: true, appliedCount: 1, withdrawnCount: 0 });

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    act(() => {
      result.current.toggle("2099-09-01");
    });
    await act(async () => {
      result.current.save();
    });

    onApply.mockResolvedValue({ ok: true, appliedCount: 0, withdrawnCount: 1 });
    await act(async () => {
      result.current.undo?.execute();
    });

    expect(onApply).toHaveBeenLastCalledWith({
      applyScheduleIds: [],
      withdrawScheduleIds: ["schedule-open"],
    });
    expect(result.current.savedApplied).toEqual(new Set(["2099-09-02"]));
    expect(result.current.undo?.count).toBe(1);
    expect(typeof result.current.undo?.execute).toBe("function");
  });

  it("저장 성공 뒤 새 toggle을 시작하면 되돌리기 메모리가 사라진다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({ ok: true, appliedCount: 1, withdrawnCount: 0 });

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    act(() => {
      result.current.toggle("2099-09-01");
    });
    await act(async () => {
      result.current.save();
    });
    await waitFor(() => expect(result.current.undo).not.toBeNull());

    act(() => {
      result.current.toggle("2099-09-01");
    });

    expect(result.current.undo).toBeNull();
  });

  it("changeCount가 0이면 save를 호출해도 onApply가 실행되지 않는다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn();

    const { result } = renderHook(() => useApplicationBatch({ schedules: SCHEDULES, onApply }));

    await act(async () => {
      result.current.save();
    });

    expect(onApply).not.toHaveBeenCalled();
  });
});
