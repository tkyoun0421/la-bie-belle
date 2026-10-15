import { act, fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ReduceMotion } from "react-native-reanimated";
import type * as ReanimatedCalls from "@tests/setup/reanimatedCalls";
import {
  animationCalls,
  clearAnimationCalls,
  type TimingConfig,
} from "@tests/setup/reanimatedCalls";

const mockSetting = { enabled: false };

jest.mock("react-native-reanimated", () =>
  jest
    .requireActual<typeof ReanimatedCalls>("@tests/setup/reanimatedCalls")
    .createReanimatedMock(),
);

jest.mock(
  "../../lib/reduceMotion.lib",
  () => ({
    REDUCE_MOTION_SOURCE: {
      isReduceMotionEnabled: () => Promise.resolve(mockSetting.enabled),
      addEventListener: () => ({ remove: () => {} }),
    },
  }),
  { virtual: true },
);

type PressProps = {
  disabled?: boolean;
  onPress?: () => void;
  reduceMotion?: boolean;
};

async function renderPress({
  disabled = false,
  onPress = () => {},
  reduceMotion = false,
}: PressProps = {}) {
  mockSetting.enabled = reduceMotion;
  const { PressScale } = await import(
    // @ts-expect-error 대상 모듈이 아직 없다
    "@/shared/ui/PressScale"
  );
  const screen = render(
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="누르는 조각"
      disabled={disabled}
      onPress={onPress}
    >
      <Text>안쪽</Text>
    </PressScale>,
  );

  await act(async () => {});
  clearAnimationCalls();

  return screen;
}

function timings() {
  return animationCalls.flatMap((call) =>
    call.fn === "withTiming" ? [call] : [],
  );
}

describe("PressScale — 누르는 동안 줄었다가 떼면 돌아온다", () => {
  it("누르면 125ms 동안 0.97배로 간다", async () => {
    const { getByLabelText } = await renderPress();

    fireEvent(getByLabelText("누르는 조각"), "pressIn");

    const last = timings()[timings().length - 1];
    expect(last.toValue).toBe(0.97);
    expect((last.config as TimingConfig).duration).toBe(125);
  });

  it("떼면 125ms 동안 1배로 돌아온다", async () => {
    const { getByLabelText } = await renderPress();

    fireEvent(getByLabelText("누르는 조각"), "pressIn");
    fireEvent(getByLabelText("누르는 조각"), "pressOut");

    const last = timings()[timings().length - 1];
    expect(last.toValue).toBe(1);
    expect((last.config as TimingConfig).duration).toBe(125);
  });

  it("disabled면 눌러도 줄지 않는다", async () => {
    const { getByLabelText } = await renderPress({ disabled: true });

    fireEvent(getByLabelText("누르는 조각"), "pressIn");

    expect(timings()).toHaveLength(0);
  });
});

describe("PressScale — 움직임 줄이기에서도 눌림은 남는다", () => {
  it("설정이 켜져 있어도 누르면 0.97배로 가고 config는 ReduceMotion.Never다", async () => {
    const { getByLabelText } = await renderPress({ reduceMotion: true });

    fireEvent(getByLabelText("누르는 조각"), "pressIn");

    const last = timings()[timings().length - 1];
    expect(last.toValue).toBe(0.97);
    expect((last.config as TimingConfig).reduceMotion).toBe(ReduceMotion.Never);
  });
});

describe("PressScale — 누르기 계약은 그대로 넘긴다", () => {
  it("누르면 onPress를 한 번 부른다", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await renderPress({ onPress });

    fireEvent.press(getByLabelText("누르는 조각"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("역할과 라벨을 보조 기술에 전한다", async () => {
    const { getByRole } = await renderPress();

    expect(getByRole("button").props.accessibilityLabel).toBe("누르는 조각");
  });

  it("자식을 렌더한다", async () => {
    const { getByText } = await renderPress();

    expect(getByText("안쪽")).toBeTruthy();
  });
});
