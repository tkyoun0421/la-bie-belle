import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWeekSelection, type WeekDay } from "@/views/home/hooks/useWeekSelection";

const THREE_SHIFT_WEEK: readonly WeekDay[] = [
  { date: "2026-08-17", hasShift: false },
  { date: "2026-08-18", hasShift: true },
  { date: "2026-08-19", hasShift: true },
  { date: "2026-08-20", hasShift: false },
  { date: "2026-08-21", hasShift: true },
  { date: "2026-08-22", hasShift: false },
  { date: "2026-08-23", hasShift: false },
];

const EMPTY_WEEK: readonly WeekDay[] = THREE_SHIFT_WEEK.map((day) => ({
  ...day,
  hasShift: false,
}));

describe("useWeekSelection (위험 기반 테스트 21·22 — 상태의 자리)", () => {
  it("처음 마운트되면 선택된 날이 없어 주 요약을 가리킨다", () => {
    const { result } = renderHook(() => useWeekSelection(THREE_SHIFT_WEEK));

    expect(result.current.selectedDate).toBeNull();
  });

  it("근무 있는 날을 고르면 그 날짜가 선택된다", () => {
    const { result } = renderHook(() => useWeekSelection(THREE_SHIFT_WEEK));

    act(() => {
      result.current.select("2026-08-19");
    });

    expect(result.current.selectedDate).toBe("2026-08-19");
  });

  it("근무 없는 날은 눌려도 선택되지 않는다", () => {
    const { result } = renderHook(() => useWeekSelection(THREE_SHIFT_WEEK));

    act(() => {
      result.current.select("2026-08-20");
    });

    expect(result.current.selectedDate).toBeNull();
  });

  it("빈 주에서는 어떤 날짜를 골라도 선택되지 않는다", () => {
    const { result } = renderHook(() => useWeekSelection(EMPTY_WEEK));

    act(() => {
      result.current.select("2026-08-18");
    });

    expect(result.current.selectedDate).toBeNull();
  });

  it("같은 날을 두 번 누르면 선택이 풀려 주 요약으로 돌아온다", () => {
    const { result } = renderHook(() => useWeekSelection(THREE_SHIFT_WEEK));

    act(() => {
      result.current.select("2026-08-18");
    });
    expect(result.current.selectedDate).toBe("2026-08-18");

    act(() => {
      result.current.select("2026-08-18");
    });

    expect(result.current.selectedDate).toBeNull();
  });

  it("선택된 상태에서 다른 근무일을 누르면 토글 없이 그 날로 바로 바뀐다", () => {
    const { result } = renderHook(() => useWeekSelection(THREE_SHIFT_WEEK));

    act(() => {
      result.current.select("2026-08-18");
    });
    act(() => {
      result.current.select("2026-08-21");
    });

    expect(result.current.selectedDate).toBe("2026-08-21");
  });

  it("주어진 주에 없는 날짜를 고르면 선택 상태가 바뀌지 않는다", () => {
    const { result } = renderHook(() => useWeekSelection(THREE_SHIFT_WEEK));

    act(() => {
      result.current.select("2026-09-01");
    });

    expect(result.current.selectedDate).toBeNull();
  });
});
