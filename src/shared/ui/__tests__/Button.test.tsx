import { fireEvent, render } from "@testing-library/react-native";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Button, type ButtonVariant } from "@/shared/ui/Button";
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

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
];

function timings() {
  return animationCalls.flatMap((call) =>
    call.fn === "withTiming" ? [call] : [],
  );
}

function lastTiming() {
  const all = timings();

  if (all.length === 0) {
    throw new Error("눌림 애니메이션이 한 번도 안 돌았다");
  }

  return all[all.length - 1];
}

function renderButton(
  props: Partial<React.ComponentProps<typeof Button>> = {},
) {
  const screen = render(
    <Button accessibilityLabel="저장" {...props}>
      저장
    </Button>,
  );

  clearAnimationCalls();

  return screen;
}

describe("Button — 누르는 동안 줄었다가 떼면 돌아온다", () => {
  it("누르면 125ms 동안 0.97배로 간다", () => {
    const { getByLabelText } = renderButton();

    fireEvent(getByLabelText("저장"), "pressIn");

    const last = lastTiming();
    expect(last.toValue).toBe(0.97);
    expect((last.config as TimingConfig).duration).toBe(125);
  });

  it("누르는 곡선이 ease-out이다", () => {
    const { getByLabelText } = renderButton();

    fireEvent(getByLabelText("저장"), "pressIn");

    const last = lastTiming();
    expect(easingAt((last.config as TimingConfig).easing, 0.5)).toBeCloseTo(
      EASE_OUT_AT_HALF,
      3,
    );
  });

  it("떼면 1배로 돌아온다", () => {
    const { getByLabelText } = renderButton();

    fireEvent(getByLabelText("저장"), "pressIn");
    fireEvent(getByLabelText("저장"), "pressOut");

    const last = lastTiming();
    expect(last.toValue).toBe(1);
    expect((last.config as TimingConfig).duration).toBe(125);
  });

  it.each(VARIANTS)("%s 변형도 누르면 0.97배로 간다", (variant) => {
    const { getByLabelText } = renderButton({ variant });

    fireEvent(getByLabelText("저장"), "pressIn");

    const last = lastTiming();
    expect(last.toValue).toBe(0.97);
  });
});

describe("Button — 못 누르는 상태에서는 줄지 않는다", () => {
  it("disabled면 눌러도 줄지 않는다", () => {
    const { getByLabelText } = renderButton({ disabled: true });

    fireEvent(getByLabelText("저장"), "pressIn");

    expect(timings()).toHaveLength(0);
  });

  it("loading이면 눌러도 줄지 않는다", () => {
    const { getByLabelText } = renderButton({ loading: true });

    fireEvent(getByLabelText("저장"), "pressIn");

    expect(timings()).toHaveLength(0);
  });
});

describe("Button — 누르기 계약은 그대로다", () => {
  it("누르면 onPress를 한 번 부른다", () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderButton({ onPress });

    fireEvent.press(getByLabelText("저장"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("onPressIn과 onPressOut을 부른다", () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByLabelText } = renderButton({ onPressIn, onPressOut });

    fireEvent(getByLabelText("저장"), "pressIn");
    fireEvent(getByLabelText("저장"), "pressOut");

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it("disabled면 onPress를 안 부른다", () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderButton({ onPress, disabled: true });

    fireEvent.press(getByLabelText("저장"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("loading이면 onPress를 안 부르고 스피너를 보인다", () => {
    const onPress = jest.fn();
    const { getByLabelText, UNSAFE_queryByType } = renderButton({
      onPress,
      loading: true,
    });

    fireEvent.press(getByLabelText("저장"));

    expect(onPress).not.toHaveBeenCalled();
    expect(UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
  });

  it("loading이 아니면 스피너가 없다", () => {
    const { UNSAFE_queryByType } = renderButton();

    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it("역할이 button이다", () => {
    const { getByRole } = renderButton();

    expect(getByRole("button")).toBeTruthy();
  });
});

describe("Button — className을 받은 요소가 줄어드는 요소다", () => {
  it("flex-1을 받은 요소가 transform을 받고 그 바깥에 transform 요소가 없다", () => {
    const { UNSAFE_root } = renderButton({ className: "flex-1" });

    const hosts = UNSAFE_root.findAll((node) => typeof node.type === "string");
    const scaled = hosts.filter(
      (node) => StyleSheet.flatten(node.props.style)?.transform !== undefined,
    );

    expect(scaled).toHaveLength(1);
    expect(String(scaled[0].props.className)).toContain("flex-1");
  });
});
