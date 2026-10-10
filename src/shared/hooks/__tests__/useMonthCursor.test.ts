import { jest } from "@jest/globals";

const { renderHook, act } = await import("@testing-library/react-native");
const { useMonthCursor } = await import("@/shared/hooks/useMonthCursor");

describe("useMonthCursor — 첫 달을 그대로 든다", () => {
  it("받은 첫 달이 그대로 선다", () => {
    const { result } = renderHook(() => useMonthCursor("2026-10"));

    expect(result.current.month).toBe("2026-10");
  });
});

describe("useMonthCursor — goNext·goPrev가 한 달씩 옮긴다", () => {
  it("goNext를 부르면 다음 달로 간다", () => {
    const { result } = renderHook(() => useMonthCursor("2026-10"));

    act(() => result.current.goNext());

    expect(result.current.month).toBe("2026-11");
  });

  it("goPrev를 부르면 이전 달로 간다", () => {
    const { result } = renderHook(() => useMonthCursor("2026-10"));

    act(() => result.current.goPrev());

    expect(result.current.month).toBe("2026-09");
  });
});

describe("useMonthCursor — 해를 넘는 자리를 센다", () => {
  it("12월에서 다음으로 가면 다음 해 1월이다", () => {
    const { result } = renderHook(() => useMonthCursor("2026-12"));

    act(() => result.current.goNext());

    expect(result.current.month).toBe("2027-01");
  });

  it("1월에서 이전으로 가면 지난 해 12월이다", () => {
    const { result } = renderHook(() => useMonthCursor("2026-01"));

    act(() => result.current.goPrev());

    expect(result.current.month).toBe("2025-12");
  });
});

describe("useMonthCursor — 달이 바뀔 때마다 onMove를 부른다", () => {
  it("goNext와 goPrev가 옮길 때마다 한 번씩 부른다", () => {
    const onMove = jest.fn<() => void>();
    const { result } = renderHook(() => useMonthCursor("2026-10", onMove));

    act(() => result.current.goNext());
    act(() => result.current.goPrev());

    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it("onMove를 안 주면 옮겨도 안 깨진다", () => {
    const { result } = renderHook(() => useMonthCursor("2026-10"));

    expect(() => act(() => result.current.goNext())).not.toThrow();
    expect(result.current.month).toBe("2026-11");
  });
});
