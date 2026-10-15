import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ReduceMotion } from "react-native-reanimated";
import { Rise } from "@/shared/ui/Rise";
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

jest.mock("@/shared/lib/reduceMotion.lib", () => ({
  REDUCE_MOTION_SOURCE: {
    isReduceMotionEnabled: () => Promise.resolve(mockSetting.enabled),
    addEventListener: () => ({ remove: () => {} }),
  },
}));

type EnteringValues = Record<string, number>;
type Entering = (values: EnteringValues) => {
  initialValues: { opacity?: number; transform?: Record<string, number>[] };
  animations: Record<string, unknown>;
};

async function renderRise(index: number, reduceMotion: boolean) {
  mockSetting.enabled = reduceMotion;
  const screen = render(
    <Rise index={index}>
      <Text>등장하는 조각</Text>
    </Rise>,
  );

  await act(async () => {});

  return screen;
}

function enteringOf(screen: Awaited<ReturnType<typeof renderRise>>): Entering {
  const holders = screen.UNSAFE_root.findAll(
    (node) => typeof node.props.entering === "function",
  );

  if (holders.length === 0) {
    throw new Error("entering 함수를 받은 요소가 없다");
  }

  return holders[holders.length - 1].props.entering;
}

function runEntering(entering: Entering) {
  clearAnimationCalls();

  return entering({
    targetOriginX: 0,
    targetOriginY: 0,
    targetWidth: 100,
    targetHeight: 40,
    targetGlobalOriginX: 0,
    targetGlobalOriginY: 0,
    windowWidth: 400,
    windowHeight: 800,
  });
}

function timings() {
  return animationCalls.flatMap((call) =>
    call.fn === "withTiming" ? [call] : [],
  );
}

function delays(): number[] {
  return animationCalls.flatMap((call) =>
    call.fn === "withDelay" ? [call.delay] : [],
  );
}

function translateYOf(entering: ReturnType<Entering>): number | undefined {
  return entering.initialValues.transform?.find(
    (entry) => "translateY" in entry,
  )?.translateY;
}

describe("Rise — 자식을 그대로 보이고 index만큼 어긋나 등장한다", () => {
  it("자식을 렌더한다", async () => {
    const { getByText } = await renderRise(0, false);

    expect(getByText("등장하는 조각")).toBeTruthy();
  });

  it("네 번째 요소는 210ms 기다렸다가 300ms 동안 움직인다", async () => {
    const screen = await renderRise(3, false);

    runEntering(enteringOf(screen));

    expect(delays()).toContain(210);
    expect(timings().length).toBeGreaterThan(0);
    expect(
      timings().every((call) => (call.config as TimingConfig).duration === 300),
    ).toBe(true);
  });

  it("움직임 줄이기가 꺼져 있으면 8px 아래에서 올라온다", async () => {
    const screen = await renderRise(3, false);

    const result = runEntering(enteringOf(screen));

    expect(translateYOf(result)).toBe(8);
  });

  it("모든 애니메이션 config가 OS 설정을 따르지 않는다(ReduceMotion.Never)", async () => {
    const screen = await renderRise(3, false);

    runEntering(enteringOf(screen));

    expect(timings().length).toBeGreaterThan(0);
    expect(
      timings().every(
        (call) =>
          (call.config as TimingConfig).reduceMotion === ReduceMotion.Never,
      ),
    ).toBe(true);
  });
});

describe("Rise — 움직임 줄이기가 켜져 있으면 이동만 빼고 밝기는 남긴다", () => {
  it("이동 거리가 0이다", async () => {
    const screen = await renderRise(3, true);

    const result = runEntering(enteringOf(screen));

    expect(translateYOf(result) ?? 0).toBe(0);
  });

  it("밝기 애니메이션은 지연 210ms와 시간 300ms로 남는다", async () => {
    const screen = await renderRise(3, true);

    const result = runEntering(enteringOf(screen));

    expect(result.animations.opacity).toBeDefined();
    expect(delays()).toContain(210);
    expect(
      timings().every((call) => (call.config as TimingConfig).duration === 300),
    ).toBe(true);
  });

  it("움직임 줄이기에서도 config는 ReduceMotion.Never다", async () => {
    const screen = await renderRise(3, true);

    runEntering(enteringOf(screen));

    expect(
      timings().every(
        (call) =>
          (call.config as TimingConfig).reduceMotion === ReduceMotion.Never,
      ),
    ).toBe(true);
  });
});
