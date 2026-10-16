export type TimingConfig = {
  duration?: number;
  reduceMotion?: unknown;
  easing?: unknown;
};

export type AnimationCall =
  | { fn: "withTiming"; toValue: unknown; config: TimingConfig | undefined }
  | { fn: "withDelay"; delay: number };

export const animationCalls: AnimationCall[] = [];

export function clearAnimationCalls(): void {
  animationCalls.length = 0;
}

type EasingFactory = { factory: () => (x: number) => number };

function isEasingFactory(value: unknown): value is EasingFactory {
  return (
    typeof value === "object" &&
    value !== null &&
    "factory" in value &&
    typeof value.factory === "function"
  );
}

export function easingAt(easing: unknown, x: number): number {
  if (!isEasingFactory(easing)) {
    throw new Error("bezier easing이 아니다");
  }

  return easing.factory()(x);
}

export function cubicBezierAt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  const along = (a: number, b: number, t: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  let low = 0;
  let high = 1;

  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2;

    if (along(x1, x2, mid) < x) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return along(y1, y2, (low + high) / 2);
}

export const EASE_OUT_AT_HALF = cubicBezierAt(0, 0, 0.2, 1, 0.5);

export function createReanimatedMock() {
  const actual = jest.requireActual("react-native-reanimated");
  const { Easing } = jest.requireActual<{ Easing: unknown }>(
    "react-native-reanimated/lib/module/Easing",
  );

  return {
    ...actual,
    __esModule: true,
    Easing,
    withTiming: (toValue: unknown, config?: TimingConfig) => {
      animationCalls.push({ fn: "withTiming", toValue, config });

      return toValue;
    },
    withDelay: (delay: number, next: unknown) => {
      animationCalls.push({ fn: "withDelay", delay });

      return next;
    },
  };
}
