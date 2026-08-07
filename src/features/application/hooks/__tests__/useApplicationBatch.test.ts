import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";
import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

type TestSchedule = {
  id: string;
  workDate: string;
  applicationDeadline: string;
  status: RecruitmentScheduleStatus;
  applicationStatus: "applied" | "withdrawn" | null;
};

const SCHEDULES: TestSchedule[] = [
  {
    id: "schedule-open",
    workDate: "2099-09-01",
    applicationDeadline: "2099-09-01",
    status: "OPEN",
    applicationStatus: null,
  },
  {
    id: "schedule-applied",
    workDate: "2099-09-02",
    applicationDeadline: "2099-09-02",
    status: "OPEN",
    applicationStatus: "applied",
  },
];

const OCTOBER_SCHEDULES: TestSchedule[] = [
  {
    id: "schedule-open-oct",
    workDate: "2099-10-01",
    applicationDeadline: "2099-10-01",
    status: "OPEN",
    applicationStatus: null,
  },
  {
    id: "schedule-applied-oct",
    workDate: "2099-10-02",
    applicationDeadline: "2099-10-02",
    status: "OPEN",
    applicationStatus: "applied",
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

  it("월 이동으로 schedules가 교체되면 새 달의 신청 상태가 savedApplied에 반영되고 이전 달의 미저장 선택은 유지된다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn();

    const { result, rerender } = renderHook(
      ({ schedules }) => useApplicationBatch({ schedules, onApply }),
      { initialProps: { schedules: SCHEDULES } },
    );

    act(() => {
      result.current.toggle("2099-09-01");
    });
    expect(result.current.pending).toEqual(new Set(["2099-09-01", "2099-09-02"]));

    rerender({ schedules: OCTOBER_SCHEDULES });

    expect(result.current.savedApplied).toEqual(new Set(["2099-09-02", "2099-10-02"]));
    expect(result.current.pending).toEqual(new Set(["2099-09-01", "2099-09-02", "2099-10-02"]));
    expect(result.current.changeCount).toBe(1);
  });

  it("월 이동 뒤 저장하면 이전 달에서 만든 선택도 함께 전송된다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({ ok: true, appliedCount: 1, withdrawnCount: 0 });

    const { result, rerender } = renderHook(
      ({ schedules }) => useApplicationBatch({ schedules, onApply }),
      { initialProps: { schedules: SCHEDULES } },
    );

    act(() => {
      result.current.toggle("2099-09-01");
    });
    rerender({ schedules: OCTOBER_SCHEDULES });

    await act(async () => {
      result.current.save();
    });

    expect(onApply).toHaveBeenCalledWith({
      applyScheduleIds: ["schedule-open"],
      withdrawScheduleIds: [],
    });
  });

  it("pending 날짜의 스케줄이 더 이상 OPEN이 아니게 되면 그 날짜만 pending에서 정리된다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn();

    const { result, rerender } = renderHook(
      ({ schedules }) => useApplicationBatch({ schedules, onApply }),
      { initialProps: { schedules: SCHEDULES } },
    );

    act(() => {
      result.current.toggle("2099-09-01");
    });
    expect(result.current.pending.has("2099-09-01")).toBe(true);

    const CLOSED_SCHEDULES = [{ ...SCHEDULES[0]!, status: "CLOSED" as const }, SCHEDULES[1]!];
    rerender({ schedules: CLOSED_SCHEDULES });

    expect(result.current.pending).toEqual(new Set(["2099-09-02"]));
    expect(result.current.changeCount).toBe(0);
  });

  it("이미 신청된 날짜가 CLOSED로 바뀌어도 신청 상태는 그대로 유지된다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn();

    const { result, rerender } = renderHook(
      ({ schedules }) => useApplicationBatch({ schedules, onApply }),
      { initialProps: { schedules: SCHEDULES } },
    );

    expect(result.current.pending.has("2099-09-02")).toBe(true);

    const CLOSED_APPLIED_SCHEDULES = [
      SCHEDULES[0]!,
      { ...SCHEDULES[1]!, status: "CLOSED" as const },
    ];
    rerender({ schedules: CLOSED_APPLIED_SCHEDULES });

    expect(result.current.savedApplied.has("2099-09-02")).toBe(true);
    expect(result.current.pending.has("2099-09-02")).toBe(true);
    expect(result.current.changeCount).toBe(0);
  });

  it("저장 후 다른 달로 이동해 되돌리면 그 달의 기존 신청은 그대로 두고 이번 batch 날짜만 되돌아간다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({ ok: true, appliedCount: 1, withdrawnCount: 0 });

    const { result, rerender } = renderHook(
      ({ schedules }) => useApplicationBatch({ schedules, onApply }),
      { initialProps: { schedules: SCHEDULES } },
    );

    act(() => {
      result.current.toggle("2099-09-01");
    });
    await act(async () => {
      result.current.save();
    });
    await waitFor(() => expect(result.current.undo).not.toBeNull());

    rerender({ schedules: OCTOBER_SCHEDULES });
    expect(result.current.savedApplied.has("2099-10-02")).toBe(true);

    onApply.mockClear();
    onApply.mockResolvedValue({ ok: true, appliedCount: 0, withdrawnCount: 1 });
    await act(async () => {
      result.current.undo?.execute();
    });

    expect(onApply).toHaveBeenCalledWith({
      applyScheduleIds: [],
      withdrawScheduleIds: ["schedule-open"],
    });
    expect(result.current.savedApplied.has("2099-10-02")).toBe(true);
  });

  it("같은 날짜에 CANCELLED 행과 활성 행이 공존하면 활성 행의 정보만 반영된다", async () => {
    const { useApplicationBatch } =
      await import("@/features/application/hooks/useApplicationBatch");
    const onApply = vi.fn().mockResolvedValue({ ok: true, appliedCount: 1, withdrawnCount: 0 });

    const REOPENED_SCHEDULES: TestSchedule[] = [
      {
        id: "schedule-reopened",
        workDate: "2099-11-01",
        applicationDeadline: "2099-11-01",
        status: "OPEN",
        applicationStatus: null,
      },
      {
        id: "schedule-cancelled",
        workDate: "2099-11-01",
        applicationDeadline: "2099-11-01",
        status: "CANCELLED",
        applicationStatus: "applied",
      },
    ];

    const { result, rerender } = renderHook(
      ({ schedules }) => useApplicationBatch({ schedules, onApply }),
      { initialProps: { schedules: SCHEDULES } },
    );

    rerender({ schedules: REOPENED_SCHEDULES });

    expect(result.current.savedApplied.has("2099-11-01")).toBe(false);
    expect(result.current.pending.has("2099-11-01")).toBe(false);

    act(() => {
      result.current.toggle("2099-11-01");
    });
    await act(async () => {
      result.current.save();
    });

    expect(onApply).toHaveBeenCalledWith({
      applyScheduleIds: ["schedule-reopened"],
      withdrawScheduleIds: [],
    });
  });
});
