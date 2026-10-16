import { act, render } from "@testing-library/react-native";
import type { ReduceMotionSource } from "@/shared/lib/reduceMotion.lib";
import { Skeleton, SkeletonLine } from "@/shared/ui/Skeleton";

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
