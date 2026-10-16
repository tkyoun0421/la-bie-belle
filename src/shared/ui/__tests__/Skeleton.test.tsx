import { act, fireEvent, render } from "@testing-library/react-native";
import { Easing } from "react-native-reanimated";
import type { ReduceMotionSource } from "@/shared/lib/reduceMotion.lib";
import { Skeleton, SkeletonLine } from "@/shared/ui/Skeleton";
import type * as ReanimatedCalls from "@tests/setup/reanimatedCalls";
import {
  animationCalls,
  clearAnimationCalls,
} from "@tests/setup/reanimatedCalls";

type Listener = (enabled: boolean) => void;

const listeners: Listener[] = [];
const mockSetting: {
  lastKnown: boolean | undefined;
  read: "reduce" | "full" | "pending" | "failing";
} = { lastKnown: undefined, read: "pending" };

const mockSource: ReduceMotionSource = {
  isReduceMotionEnabled: () => {
    if (mockSetting.read === "pending") {
      return new Promise<boolean>(() => {});
    }

    return mockSetting.read === "failing"
      ? Promise.reject(new Error("read failed"))
      : Promise.resolve(mockSetting.read === "reduce");
  },
  addEventListener: (_event, listener) => {
    listeners.push(listener);

    return { remove: () => {} };
  },
  lastKnownReduceMotion: () => mockSetting.lastKnown,
};

jest.mock("@/shared/lib/reduceMotion.lib", () => ({
  REDUCE_MOTION_SOURCE: {
    isReduceMotionEnabled: () => mockSource.isReduceMotionEnabled(),
    addEventListener: (event: "reduceMotionChanged", listener: Listener) =>
      mockSource.addEventListener(event, listener),
    lastKnownReduceMotion: () => mockSource.lastKnownReduceMotion?.(),
  },
}));

jest.mock("react-native-reanimated", () =>
  jest
    .requireActual<typeof ReanimatedCalls>("@tests/setup/reanimatedCalls")
    .createReanimatedMock(),
);

const SHAPES = [
  { name: "Skeleton", Shape: Skeleton },
  { name: "SkeletonLine", Shape: SkeletonLine },
];

async function renderShape(
  Shape: typeof Skeleton,
  setting: Partial<typeof mockSetting>,
) {
  listeners.length = 0;
  mockSetting.lastKnown = setting.lastKnown;
  mockSetting.read = setting.read ?? "pending";

  const screen = render(<Shape testID="shape" />);

  await act(async () => {});

  return screen;
}

describe.each(SHAPES)("$name — 동작 줄이기에서는 덩이만 선다", ({ Shape }) => {
  it("설정이 켜져 있으면 shimmer 요소가 없다", async () => {
    const { queryByTestId } = await renderShape(Shape, { read: "reduce" });

    expect(queryByTestId("shape")).toBeTruthy();
    expect(queryByTestId("shape-shimmer")).toBeNull();
  });

  it("설정을 읽기 전에는 shimmer 요소가 없다", async () => {
    const { queryByTestId } = await renderShape(Shape, { read: "pending" });

    expect(queryByTestId("shape")).toBeTruthy();
    expect(queryByTestId("shape-shimmer")).toBeNull();
  });

  it("설정 읽기가 실패해도 shimmer 요소가 없다", async () => {
    const { queryByTestId } = await renderShape(Shape, { read: "failing" });

    expect(queryByTestId("shape")).toBeTruthy();
    expect(queryByTestId("shape-shimmer")).toBeNull();
  });
});

describe.each(SHAPES)(
  "$name — 움직임이 허용되면 shimmer가 선다",
  ({ Shape }) => {
    it("설정이 꺼져 있으면 shimmer 요소가 선다", async () => {
      const { getByTestId } = await renderShape(Shape, { read: "full" });

      expect(getByTestId("shape-shimmer")).toBeTruthy();
    });

    it("앱이 이미 꺼진 설정을 알면 읽기 전 첫 렌더부터 shimmer 요소가 선다", () => {
      listeners.length = 0;
      mockSetting.lastKnown = false;
      mockSetting.read = "pending";

      const { getByTestId } = render(<Shape testID="shape" />);

      expect(getByTestId("shape-shimmer")).toBeTruthy();
    });
  },
);

describe.each(SHAPES)("$name — 설정이 바뀌면 따른다", ({ Shape }) => {
  it("켜지면 shimmer가 사라지고 꺼지면 돌아온다", async () => {
    const { queryByTestId } = await renderShape(Shape, { read: "full" });
    expect(queryByTestId("shape-shimmer")).toBeTruthy();

    act(() => listeners.forEach((listener) => listener(true)));
    expect(queryByTestId("shape-shimmer")).toBeNull();

    act(() => listeners.forEach((listener) => listener(false)));
    expect(queryByTestId("shape-shimmer")).toBeTruthy();
  });
});

const BLOCK_WIDTH = 300;

async function renderMeasured(Shape: typeof Skeleton, read: "reduce" | "full") {
  clearAnimationCalls();
  const screen = await renderShape(Shape, { read });

  fireEvent(screen.getByTestId("shape"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: BLOCK_WIDTH, height: 20 } },
  });
  await act(async () => {});

  return screen;
}

function timingCalls() {
  return animationCalls.flatMap((call) =>
    call.fn === "withTiming" ? [call] : [],
  );
}

function repeatCalls() {
  return animationCalls.flatMap((call) =>
    call.fn === "withRepeat" ? [call] : [],
  );
}

describe.each(SHAPES)(
  "$name — shimmer는 한 줄이 끝없이 지나간다",
  ({ Shape }) => {
    it("한 번 지나가는 데 1600ms가 걸린다", async () => {
      await renderMeasured(Shape, "full");

      expect(timingCalls().map((call) => call.config?.duration)).toEqual([
        1600,
      ]);
    });

    it("이징은 linear다", async () => {
      await renderMeasured(Shape, "full");

      expect(timingCalls().map((call) => call.config?.easing)).toEqual([
        Easing.linear,
      ]);
    });

    it("끝없이 되풀이하고 되돌아오지 않는다", async () => {
      await renderMeasured(Shape, "full");

      expect(repeatCalls()).toEqual([
        { fn: "withRepeat", numberOfReps: -1, reverse: false },
      ]);
    });

    it("끝 위치는 덩이의 오른쪽 밖이다", async () => {
      await renderMeasured(Shape, "full");

      const [timing] = timingCalls();

      expect(timing.toValue).toBeGreaterThanOrEqual(BLOCK_WIDTH);
    });

    it("동작 줄이기가 켜져 있으면 되풀이도 타이밍도 걸지 않는다", async () => {
      await renderMeasured(Shape, "reduce");

      expect(repeatCalls()).toHaveLength(0);
      expect(timingCalls()).toHaveLength(0);
    });
  },
);

describe("shimmer 주기 상수", () => {
  it("SHIMMER_INTERVAL_MS는 1600이다", async () => {
    const motion: Record<string, unknown> =
      await import("@/shared/consts/motion.const");

    expect(motion.SHIMMER_INTERVAL_MS).toBe(1600);
  });
});
