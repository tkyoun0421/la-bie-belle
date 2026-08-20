import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTickingNow } from "@/views/home/hooks/useTickingNow";

const BASE = new Date("2026-08-19T09:00:00+09:00");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTickingNow (F-04, confirmed/home.html:2684)", () => {
  it("첫 렌더는 base를 그대로 돌려준다", () => {
    const { result } = renderHook(() => useTickingNow(BASE, true));

    expect(result.current.getTime()).toBe(BASE.getTime());
  });

  it("1초가 지나면 1초만큼 진행한다", () => {
    const { result } = renderHook(() => useTickingNow(BASE, true));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.getTime()).toBe(BASE.getTime() + 1000);
  });

  it("5초가 지나면 5초만큼 진행한다", () => {
    const { result } = renderHook(() => useTickingNow(BASE, true));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.getTime()).toBe(BASE.getTime() + 5000);
  });

  it("active가 거짓이면 시간이 흘러도 base 그대로다", () => {
    const { result } = renderHook(() => useTickingNow(BASE, false));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.getTime()).toBe(BASE.getTime());
  });

  it("active가 거짓이면 타이머를 아예 걸지 않는다", () => {
    renderHook(() => useTickingNow(BASE, false));

    expect(vi.getTimerCount()).toBe(0);
  });

  it("언마운트 뒤 타이머가 남지 않는다", () => {
    const { unmount } = renderHook(() => useTickingNow(BASE, true));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("active가 도중에 꺼지면 타이머를 정리하고 그 시점 값에서 멈춘다", () => {
    const { result, rerender } = renderHook(
      ({ base, active }: { base: Date; active: boolean }) => useTickingNow(base, active),
      { initialProps: { base: BASE, active: true } },
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.getTime()).toBe(BASE.getTime() + 2000);

    rerender({ base: BASE, active: false });

    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.getTime()).toBe(BASE.getTime() + 2000);
  });

  it("base가 새 값으로 바뀌면 그 시점부터 다시 경과를 센다", () => {
    const { result, rerender } = renderHook(
      ({ base, active }: { base: Date; active: boolean }) => useTickingNow(base, active),
      { initialProps: { base: BASE, active: true } },
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.getTime()).toBe(BASE.getTime() + 3000);

    const NEXT_BASE = new Date(BASE.getTime() + 100_000);
    rerender({ base: NEXT_BASE, active: true });

    expect(result.current.getTime()).toBe(NEXT_BASE.getTime());

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.getTime()).toBe(NEXT_BASE.getTime() + 2000);
  });
});

describe("useTickingNow — 틱이 밀려도 실제 벽시계를 따라간다 (F-04 수정 라운드)", () => {
  it("탭이 잠들어 인터벌이 한 번만 늦게 깨어나도 실제 경과만큼 앞당겨진다", () => {
    const { result } = renderHook(() => useTickingNow(BASE, true));

    act(() => {
      vi.setSystemTime(new Date(BASE.getTime() + 60_000));
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.getTime()).toBe(BASE.getTime() + 61_000);
  });
});
