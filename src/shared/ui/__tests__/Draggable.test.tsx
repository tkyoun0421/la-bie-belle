import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Draggable } from "@/shared/ui/Draggable";
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

jest.mock("@/shared/stores/drag.context", () => ({
  useDrag: () => ({
    draggingId: null,
    overId: null,
    blocked: false,
    registerTarget: () => {},
    begin: () => {},
    move: () => {},
    finish: () => {},
  }),
}));

type PanHandlers = { onStart: () => void; onFinalize: () => void };

function isPanHandlers(value: unknown): value is PanHandlers {
  return (
    typeof value === "object" &&
    value !== null &&
    "onStart" in value &&
    typeof value.onStart === "function" &&
    "onFinalize" in value &&
    typeof value.onFinalize === "function"
  );
}

function panHandlersOf(screen: ReturnType<typeof render>): PanHandlers {
  const holder = screen.UNSAFE_root.findAll((node) =>
    isGesture(node.props.gesture),
  )[0];
  const handlers: unknown = holder?.props.gesture.handlers;

  if (!isPanHandlers(handlers)) {
    throw new Error("Pan 제스처의 onStart·onFinalize를 못 찾았다");
  }

  return handlers;
}

function isGesture(value: unknown): boolean {
  return typeof value === "object" && value !== null && "handlers" in value;
}

function renderDraggable() {
  const screen = render(
    <Draggable id="slot-1">
      <Text>끄는 조각</Text>
    </Draggable>,
  );

  clearAnimationCalls();

  return screen;
}

function lastTiming() {
  const timings = animationCalls.flatMap((call) =>
    call.fn === "withTiming" ? [call] : [],
  );

  return timings[timings.length - 1];
}

describe("Draggable — 들어 올릴 때", () => {
  it("1.03배로 125ms 동안 커진다", () => {
    const handlers = panHandlersOf(renderDraggable());

    handlers.onStart();

    const lift = lastTiming();
    expect(lift.toValue).toBe(1.03);
    expect((lift.config as TimingConfig).duration).toBe(125);
  });

  it("곡선이 ease-out이다", () => {
    const handlers = panHandlersOf(renderDraggable());

    handlers.onStart();

    expect(
      easingAt((lastTiming().config as TimingConfig).easing, 0.5),
    ).toBeCloseTo(EASE_OUT_AT_HALF, 3);
  });

  it("OS 설정을 무시하라고 하지 않는다", () => {
    const handlers = panHandlersOf(renderDraggable());

    handlers.onStart();

    expect((lastTiming().config as TimingConfig).reduceMotion).toBeUndefined();
  });
});

describe("Draggable — 놓을 때", () => {
  it("1배로 125ms 동안 돌아온다", () => {
    const handlers = panHandlersOf(renderDraggable());

    handlers.onFinalize();

    const drop = lastTiming();
    expect(drop.toValue).toBe(1);
    expect((drop.config as TimingConfig).duration).toBe(125);
  });

  it("곡선이 ease-out이다", () => {
    const handlers = panHandlersOf(renderDraggable());

    handlers.onFinalize();

    expect(
      easingAt((lastTiming().config as TimingConfig).easing, 0.5),
    ).toBeCloseTo(EASE_OUT_AT_HALF, 3);
  });

  it("OS 설정을 무시하라고 하지 않는다", () => {
    const handlers = panHandlersOf(renderDraggable());

    handlers.onFinalize();

    expect((lastTiming().config as TimingConfig).reduceMotion).toBeUndefined();
  });
});
