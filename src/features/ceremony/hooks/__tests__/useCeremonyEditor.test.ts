import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

const showSnackbar = vi.fn();
vi.mock("@/shared/ui/snackbar", () => ({ showSnackbar }));

const SCHEDULE_ID = "13000000-0000-4000-8000-000000000001";

const RULES = [
  { firstCeremonyAt: "10:00", recommendedCheckIn: "08:20" },
  { firstCeremonyAt: "11:00", recommendedCheckIn: "09:10" },
];

function baseInitial(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    scheduleId: SCHEDULE_ID,
    ceremonyTimes: ["10:00", "11:00"],
    plannedCheckin: "08:20",
    plannedCheckout: "13:00",
    checkInRules: RULES,
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCeremonyEditor", () => {
  it("초기 상태는 initial 값을 그대로 반영한다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi.fn();
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    expect(result.current.ceremonyTimes).toEqual(["10:00", "11:00"]);
    expect(result.current.plannedCheckin).toBe("08:20");
    expect(result.current.plannedCheckout).toBe("13:00");
    expect(result.current.pendingRecommendation).toBeNull();
    expect(result.current.saving).toBe(false);
  });

  it("generateFromCount는 1시간 간격 목록을 만든다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi.fn();
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(
        baseInitial({ ceremonyTimes: [], plannedCheckin: null, plannedCheckout: null }),
        onReplaceCeremonies,
        onSetPlannedTimes,
      ),
    );

    act(() => {
      result.current.generateFromCount(3, "11:00");
    });

    expect(result.current.ceremonyTimes).toEqual(["11:00", "12:00", "13:00"]);
  });

  it("updateCeremonyTime은 지정한 인덱스만 로컬에서 바꾼다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi.fn();
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.updateCeremonyTime(1, "12:10");
    });

    expect(result.current.ceremonyTimes).toEqual(["10:00", "12:10"]);
  });

  it("addCeremonyTime과 removeCeremonyTime으로 목록 개수를 바꾼다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi.fn();
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.addCeremonyTime("14:00");
    });
    expect(result.current.ceremonyTimes).toEqual(["10:00", "11:00", "14:00"]);

    act(() => {
      result.current.removeCeremonyTime(0);
    });
    expect(result.current.ceremonyTimes).toEqual(["11:00", "14:00"]);
  });

  it("첫·마지막이 그대로면(무변경) 저장 후 재추천 확인창을 열지 않는다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi
      .fn()
      .mockResolvedValue({ ok: true, ceremonyTimes: ["10:00", "10:30", "11:00"], changed: true });
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.addCeremonyTime("10:30");
    });
    await act(async () => {
      result.current.saveCeremonies();
    });

    await waitFor(() => expect(result.current.saving).toBe(false));
    expect(result.current.ceremonyTimes).toEqual(["10:00", "10:30", "11:00"]);
    expect(result.current.pendingRecommendation).toBeNull();
    expect(onSetPlannedTimes).not.toHaveBeenCalled();
  });

  it("첫 예식이 바뀌면 저장 후 재추천 확인창을 연다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi
      .fn()
      .mockResolvedValue({ ok: true, ceremonyTimes: ["09:00", "11:00"], changed: true });
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.updateCeremonyTime(0, "09:00");
    });
    await act(async () => {
      result.current.saveCeremonies();
    });

    await waitFor(() => expect(result.current.pendingRecommendation).not.toBeNull());
    expect(result.current.pendingRecommendation).toEqual({
      checkin: "07:20",
      checkout: { time: "13:00", capped: false },
    });
  });

  it("재추천 확인창 승인은 onSetPlannedTimes를 호출하고 예정 시각을 갱신한다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi
      .fn()
      .mockResolvedValue({ ok: true, ceremonyTimes: ["09:00", "11:00"], changed: true });
    const onSetPlannedTimes = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.updateCeremonyTime(0, "09:00");
    });
    await act(async () => {
      result.current.saveCeremonies();
    });
    await waitFor(() => expect(result.current.pendingRecommendation).not.toBeNull());

    await act(async () => {
      result.current.confirmRecommendation();
    });

    expect(onSetPlannedTimes).toHaveBeenCalledWith({
      scheduleId: SCHEDULE_ID,
      checkin: "07:20",
      checkout: "13:00",
    });
    await waitFor(() => expect(result.current.plannedCheckin).toBe("07:20"));
    expect(result.current.plannedCheckout).toBe("13:00");
    expect(result.current.pendingRecommendation).toBeNull();
  });

  it("재추천 확인창 거부는 예정 시각을 바꾸지 않고 닫는다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi
      .fn()
      .mockResolvedValue({ ok: true, ceremonyTimes: ["09:00", "11:00"], changed: true });
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.updateCeremonyTime(0, "09:00");
    });
    await act(async () => {
      result.current.saveCeremonies();
    });
    await waitFor(() => expect(result.current.pendingRecommendation).not.toBeNull());

    act(() => {
      result.current.dismissRecommendation();
    });

    expect(onSetPlannedTimes).not.toHaveBeenCalled();
    expect(result.current.plannedCheckin).toBe("08:20");
    expect(result.current.pendingRecommendation).toBeNull();
  });

  it("저장 실패 시 로컬 편집 상태를 보존하고 에러 토스트를 띄운다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
    const onSetPlannedTimes = vi.fn();

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    act(() => {
      result.current.updateCeremonyTime(1, "12:10");
    });
    await act(async () => {
      result.current.saveCeremonies();
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_STATUS_CONFLICT.message),
    );
    expect(result.current.ceremonyTimes).toEqual(["10:00", "12:10"]);
    expect(result.current.pendingRecommendation).toBeNull();
  });

  it("savePlannedTimesManually는 직접 입력한 예정 시각을 저장하고 상태를 갱신한다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi.fn();
    const onSetPlannedTimes = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    await act(async () => {
      result.current.savePlannedTimesManually("07:30", "13:30");
    });

    expect(onSetPlannedTimes).toHaveBeenCalledWith({
      scheduleId: SCHEDULE_ID,
      checkin: "07:30",
      checkout: "13:30",
    });
    await waitFor(() => expect(result.current.plannedCheckin).toBe("07:30"));
    expect(result.current.plannedCheckout).toBe("13:30");
  });

  it("savePlannedTimesManually가 실패하면 에러 토스트를 띄우고 기존 예정 시각을 보존한다", async () => {
    const { useCeremonyEditor } = await import("@/features/ceremony/hooks/useCeremonyEditor");
    const onReplaceCeremonies = vi.fn();
    const onSetPlannedTimes = vi
      .fn()
      .mockResolvedValue({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });

    const { result } = renderHook(() =>
      useCeremonyEditor(baseInitial(), onReplaceCeremonies, onSetPlannedTimes),
    );

    await act(async () => {
      result.current.savePlannedTimesManually("14:00", "10:00");
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(ERROR_CODES.SCHEDULING_VALIDATION.message),
    );
    expect(result.current.plannedCheckin).toBe("08:20");
    expect(result.current.plannedCheckout).toBe("13:00");
  });
});
