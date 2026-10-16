import { fireEvent, render } from "@testing-library/react-native";
import { Segment } from "@/shared/ui/Segment";
import type * as ReanimatedCalls from "@tests/setup/reanimatedCalls";
import {
  animationCalls,
  clearAnimationCalls,
  easingAt,
  EASE_OUT_AT_HALF,
  type TimingConfig,
} from "@tests/setup/reanimatedCalls";

jest.mock("react-native-reanimated", () =>
  jest
    .requireActual<typeof ReanimatedCalls>("@tests/setup/reanimatedCalls")
    .createReanimatedMock(),
);

const OPTIONS = [
  { value: "a", label: "하나" },
  { value: "b", label: "둘" },
];

const TRACK_WIDTH = 204;

function renderSegment(value: string) {
  const screen = render(
    <Segment
      testID="seg"
      options={OPTIONS}
      value={value}
      onChange={() => {}}
    />,
  );

  fireEvent(screen.getByTestId("seg"), "layout", {
    nativeEvent: { layout: { width: TRACK_WIDTH, height: 44, x: 0, y: 0 } },
  });

  return screen;
}

function slideTiming(value: string) {
  const screen = renderSegment("a");
  clearAnimationCalls();

  screen.rerender(
    <Segment
      testID="seg"
      options={OPTIONS}
      value={value}
      onChange={() => {}}
    />,
  );

  const timings = animationCalls.flatMap((call) =>
    call.fn === "withTiming" ? [call] : [],
  );

  return timings[timings.length - 1];
}

describe("Segment — 고른 면이 미끄러질 때", () => {
  it("다음 칸으로 125ms 동안 간다", () => {
    const slide = slideTiming("b");

    expect(slide.toValue).toBe((TRACK_WIDTH - 8) / 2);
    expect((slide.config as TimingConfig).duration).toBe(125);
  });

  it("곡선이 ease-out이다", () => {
    const slide = slideTiming("b");

    expect(easingAt((slide.config as TimingConfig).easing, 0.5)).toBeCloseTo(
      EASE_OUT_AT_HALF,
      3,
    );
  });

  it("OS 설정을 무시하라고 하지 않는다", () => {
    const slide = slideTiming("b");

    expect((slide.config as TimingConfig).reduceMotion).toBeUndefined();
  });
});
