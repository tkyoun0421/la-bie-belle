import type * as ReanimatedCalls from "@tests/setup/reanimatedCalls";
import {
  cubicBezierAt,
  easingAt,
  EASE_OUT_AT_HALF,
} from "@tests/setup/reanimatedCalls";

jest.mock("react-native-reanimated", () =>
  jest
    .requireActual<typeof ReanimatedCalls>("@tests/setup/reanimatedCalls")
    .createReanimatedMock(),
);

async function loadEaseOut(): Promise<unknown> {
  const { EASE_OUT } = await import(
    // @ts-expect-error 대상 모듈이 아직 없다
    "@/shared/lib/motionEasing.lib"
  );

  return EASE_OUT;
}

describe("EASE_OUT — 빠르게 시작해 부드럽게 멈추는 Tailwind ease-out 곡선이다", () => {
  it("시작은 0, 끝은 1이다", async () => {
    const easeOut = await loadEaseOut();

    expect(easingAt(easeOut, 0)).toBeCloseTo(0, 5);
    expect(easingAt(easeOut, 1)).toBeCloseTo(1, 5);
  });

  it("중간 지점은 cubic-bezier(0, 0, 0.2, 1)의 값이다", async () => {
    const easeOut = await loadEaseOut();

    expect(easingAt(easeOut, 0.5)).toBeCloseTo(
      cubicBezierAt(0, 0, 0.2, 1, 0.5),
      3,
    );
    expect(EASE_OUT_AT_HALF).toBeGreaterThan(0.8);
  });

  it("절반 시간에 절반 넘게 가 있어 inOut quad와 구별된다", async () => {
    const easeOut = await loadEaseOut();

    expect(easingAt(easeOut, 0.5) - 0.5).toBeGreaterThan(0.3);
  });
});
