import { jest } from "@jest/globals";
import type { LayoutChangeEvent } from "react-native";
import type {
  cancelAnimation,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { useReduceMotion } from "@/shared/hooks/useReduceMotion";

const reduceMotionMock = jest.fn<typeof useReduceMotion>();
const withRepeatMock = jest.fn<typeof withRepeat>();
const withTimingMock = jest.fn<typeof withTiming>();
const cancelAnimationMock = jest.fn<typeof cancelAnimation>();
const LINEAR = (progress: number) => progress;

jest.unstable_mockModule("@/shared/hooks/useReduceMotion", () => ({
  useReduceMotion: reduceMotionMock,
}));

const React = await import("react");

jest.unstable_mockModule("react-native-reanimated", () => ({
  __esModule: true,
  default: {},
  Easing: { linear: LINEAR },
  ReduceMotion: { Never: "never", System: "system", Always: "always" },
  useSharedValue: (initial: number) => React.useRef({ value: initial }).current,
  useAnimatedStyle: (updater: () => unknown) => updater(),
  withRepeat: withRepeatMock,
  withTiming: withTimingMock,
  cancelAnimation: cancelAnimationMock,
}));

const { act, renderHook } = await import("@testing-library/react-native");
const { useSkeletonShimmer } =
  await import("@/shared/hooks/useSkeletonShimmer");

const BLOCK_WIDTH = 300;

function layoutOf(width: number): LayoutChangeEvent {
  return {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 20 } },
  } as LayoutChangeEvent;
}

beforeEach(() => {
  reduceMotionMock.mockReset();
  withRepeatMock.mockReset();
  withTimingMock.mockReset();
  cancelAnimationMock.mockReset();
});

describe("useSkeletonShimmer — 동작 줄이기에서는 shimmer를 걸지 않는다", () => {
  it("동작 줄이기가 켜져 있으면 showShimmer가 거짓이다", () => {
    reduceMotionMock.mockReturnValue(true);

    const { result } = renderHook(() => useSkeletonShimmer());

    expect(result.current.showShimmer).toBe(false);
  });

  it("동작 줄이기가 켜져 있으면 폭을 재도 되풀이를 걸지 않는다", () => {
    reduceMotionMock.mockReturnValue(true);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    expect(withRepeatMock).not.toHaveBeenCalled();
    expect(withTimingMock).not.toHaveBeenCalled();
  });
});

describe("useSkeletonShimmer — 켜진 채 잰 폭이 꺼진 뒤에 쓰인다", () => {
  it("켜진 채 폭을 재고 꺼지면 되풀이를 한 번 걸고 끝값이 폭 이상이다", () => {
    reduceMotionMock.mockReturnValue(true);
    const { result, rerender } = renderHook(() => useSkeletonShimmer());
    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    reduceMotionMock.mockReturnValue(false);
    rerender({});

    expect(withRepeatMock).toHaveBeenCalledTimes(1);
    const [toValue] = withTimingMock.mock.calls[0];
    expect(toValue).toBeGreaterThanOrEqual(BLOCK_WIDTH);
  });
});

describe("useSkeletonShimmer — 움직임이 허용되면 폭을 잰 뒤에 한 줄이 끝없이 지나간다", () => {
  it("동작 줄이기가 꺼져 있으면 showShimmer가 참이다", () => {
    reduceMotionMock.mockReturnValue(false);

    const { result } = renderHook(() => useSkeletonShimmer());

    expect(result.current.showShimmer).toBe(true);
  });

  it("폭을 재기 전에는 되풀이를 걸지 않는다", () => {
    reduceMotionMock.mockReturnValue(false);

    renderHook(() => useSkeletonShimmer());

    expect(withRepeatMock).not.toHaveBeenCalled();
  });

  it("폭이 0으로 재어지면 되풀이를 걸지 않는다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(0)));

    expect(withRepeatMock).not.toHaveBeenCalled();
  });

  it("폭을 재면 되풀이를 한 번 건다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    expect(withRepeatMock).toHaveBeenCalledTimes(1);
  });

  it("끝없이 되풀이하고 되돌아오지 않는다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    const [, numberOfReps, reverse] = withRepeatMock.mock.calls[0];
    expect(numberOfReps).toBe(-1);
    expect(reverse).toBe(false);
  });

  it("한 번 지나가는 데 1600ms가 걸리고 이징은 linear다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    const [, config] = withTimingMock.mock.calls[0];
    expect(config?.duration).toBe(1600);
    expect(config?.easing).toBe(LINEAR);
  });

  it("끝 위치는 덩이의 오른쪽 밖이다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    const [toValue] = withTimingMock.mock.calls[0];
    expect(toValue).toBeGreaterThanOrEqual(BLOCK_WIDTH);
  });

  it("shimmer 폭은 잰 폭보다 좁다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useSkeletonShimmer());

    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));

    expect(result.current.shimmerWidth).toBeGreaterThan(0);
    expect(result.current.shimmerWidth).toBeLessThan(BLOCK_WIDTH);
  });

  it("shimmer 스타일은 translateX로 움직인다", () => {
    reduceMotionMock.mockReturnValue(false);

    const { result } = renderHook(() => useSkeletonShimmer());

    expect(result.current.shimmerStyle).toEqual({
      transform: [{ translateX: expect.anything() }],
    });
  });
});

describe("useSkeletonShimmer — 호출자의 onLayout을 막지 않는다", () => {
  it("넘긴 onLayout이 같은 이벤트로 불린다", () => {
    reduceMotionMock.mockReturnValue(false);
    const caller = jest.fn<(event: LayoutChangeEvent) => void>();
    const { result } = renderHook(() => useSkeletonShimmer(caller));
    const event = layoutOf(BLOCK_WIDTH);

    act(() => result.current.onLayout(event));

    expect(caller).toHaveBeenCalledWith(event);
  });
});

describe("useSkeletonShimmer — 멈출 때 애니메이션을 취소한다", () => {
  it("언마운트하면 cancelAnimation이 불린다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result, unmount } = renderHook(() => useSkeletonShimmer());
    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));
    cancelAnimationMock.mockClear();

    unmount();

    expect(cancelAnimationMock).toHaveBeenCalled();
  });

  it("동작 줄이기가 켜지면 cancelAnimation이 불리고 showShimmer가 거짓이 된다", () => {
    reduceMotionMock.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useSkeletonShimmer());
    act(() => result.current.onLayout(layoutOf(BLOCK_WIDTH)));
    cancelAnimationMock.mockClear();

    reduceMotionMock.mockReturnValue(true);
    rerender({});

    expect(cancelAnimationMock).toHaveBeenCalled();
    expect(result.current.showShimmer).toBe(false);
  });
});
