import { fireEvent, render } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";
import { GoogleSignInButton } from "@/screens/login/ui/GoogleSignInButton";
import type * as ReanimatedCalls from "@tests/setup/reanimatedCalls";
import {
  animationCalls,
  clearAnimationCalls,
} from "@tests/setup/reanimatedCalls";

jest.mock("react-native-reanimated", () =>
  jest
    .requireActual<typeof ReanimatedCalls>("@tests/setup/reanimatedCalls")
    .createReanimatedMock(),
);

function pressTimings() {
  return animationCalls.filter((call) => call.fn === "withTiming");
}

async function renderButton(props: { onPress: () => void; busy: boolean }) {
  return render(<GoogleSignInButton {...props} />);
}

describe("GoogleSignInButton — 도는 동안은 안 눌리고 생김새는 그대로다", () => {
  it("평소에 누르면 onPress를 한 번 부른다", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await renderButton({ onPress, busy: false });

    fireEvent.press(getByLabelText("Sign in with Google"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("busy면 눌러도 onPress를 안 부른다", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await renderButton({ onPress, busy: true });

    fireEvent.press(getByLabelText("Sign in with Google"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("busy여도 스피너가 없다", async () => {
    const { UNSAFE_queryByType } = await renderButton({
      onPress: () => {},
      busy: true,
    });

    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });
});

describe("GoogleSignInButton — 누르는 동안만 줄어든다", () => {
  it("누르기 시작하면 눌림 애니메이션이 한 번 돈다", async () => {
    const { getByLabelText } = await renderButton({
      onPress: () => {},
      busy: false,
    });
    clearAnimationCalls();

    fireEvent(getByLabelText("Sign in with Google"), "pressIn");

    expect(pressTimings()).toHaveLength(1);
  });

  it("busy면 눌러도 안 줄어든다", async () => {
    const { getByLabelText } = await renderButton({
      onPress: () => {},
      busy: true,
    });
    clearAnimationCalls();

    fireEvent(getByLabelText("Sign in with Google"), "pressIn");

    expect(pressTimings()).toHaveLength(0);
  });
});

describe("GoogleSignInButton — 보조 기술에 버튼으로 읽힌다", () => {
  it("역할이 button이고 라벨이 Sign in with Google이다", async () => {
    const { getByRole } = await renderButton({
      onPress: () => {},
      busy: false,
    });

    expect(getByRole("button").props.accessibilityLabel).toBe(
      "Sign in with Google",
    );
  });
});
