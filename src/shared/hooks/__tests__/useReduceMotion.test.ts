import { jest } from "@jest/globals";

const { act, renderHook } = await import("@testing-library/react-native");
const { useReduceMotion } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/shared/hooks/useReduceMotion"
);

function fakeSource() {
  const listeners: ((enabled: boolean) => void)[] = [];
  const events: string[] = [];
  const remove = jest.fn();
  let settle: {
    resolve: (enabled: boolean) => void;
    reject: (error: Error) => void;
  } = { resolve: () => {}, reject: () => {} };

  return {
    listeners,
    events,
    remove,
    resolveRead: (enabled: boolean) => settle.resolve(enabled),
    rejectRead: () => settle.reject(new Error("read failed")),
    emit: (enabled: boolean) =>
      listeners.forEach((listener) => listener(enabled)),
    source: {
      isReduceMotionEnabled: () =>
        new Promise<boolean>((resolve, reject) => {
          settle = { resolve, reject };
        }),
      addEventListener: (
        event: "reduceMotionChanged",
        listener: (enabled: boolean) => void,
      ) => {
        events.push(event);
        listeners.push(listener);

        return { remove };
      },
    },
  };
}

describe("useReduceMotion — 설정을 모르는 동안은 움직임 줄이기로 친다", () => {
  it("읽기 전에는 참이다", () => {
    const fake = fakeSource();

    const { result } = renderHook(() => useReduceMotion(fake.source));

    expect(result.current).toBe(true);
  });

  it("읽기가 거짓으로 풀리면 거짓이 된다", async () => {
    const fake = fakeSource();
    const { result } = renderHook(() => useReduceMotion(fake.source));

    await act(async () => fake.resolveRead(false));

    expect(result.current).toBe(false);
  });

  it("읽기가 참으로 풀리면 참이다", async () => {
    const fake = fakeSource();
    const { result } = renderHook(() => useReduceMotion(fake.source));

    await act(async () => fake.resolveRead(true));

    expect(result.current).toBe(true);
  });

  it("읽기가 실패해도 참이다", async () => {
    const fake = fakeSource();
    const { result } = renderHook(() => useReduceMotion(fake.source));

    await act(async () => fake.rejectRead());

    expect(result.current).toBe(true);
  });
});

describe("useReduceMotion — 설정이 바뀌면 따른다", () => {
  it("구독은 reduceMotionChanged로 한 번 건다", () => {
    const fake = fakeSource();

    renderHook(() => useReduceMotion(fake.source));

    expect(fake.events).toEqual(["reduceMotionChanged"]);
  });

  it("이벤트가 거짓이면 거짓, 다시 참이면 참이다", async () => {
    const fake = fakeSource();
    const { result } = renderHook(() => useReduceMotion(fake.source));

    act(() => fake.emit(false));
    expect(result.current).toBe(false);

    act(() => fake.emit(true));
    expect(result.current).toBe(true);
  });

  it("읽기가 늦게 풀려도 먼저 온 이벤트를 덮지 않는다", async () => {
    const fake = fakeSource();
    const { result } = renderHook(() => useReduceMotion(fake.source));

    act(() => fake.emit(true));
    await act(async () => fake.resolveRead(false));

    expect(result.current).toBe(true);
  });
});

describe("useReduceMotion — 화면이 빠지면 정리한다", () => {
  it("unmount하면 구독을 한 번 뗀다", () => {
    const fake = fakeSource();
    const { unmount } = renderHook(() => useReduceMotion(fake.source));

    unmount();

    expect(fake.remove).toHaveBeenCalledTimes(1);
  });

  it("unmount 뒤에 읽기가 풀려도 경고가 없다", async () => {
    const fake = fakeSource();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useReduceMotion(fake.source));

    unmount();
    await act(async () => fake.resolveRead(false));

    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
