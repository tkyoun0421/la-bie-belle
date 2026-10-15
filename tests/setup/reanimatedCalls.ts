export type TimingConfig = { duration?: number; reduceMotion?: unknown };

export type AnimationCall =
  | { fn: "withTiming"; toValue: unknown; config: TimingConfig | undefined }
  | { fn: "withDelay"; delay: number };

export const animationCalls: AnimationCall[] = [];

export function clearAnimationCalls(): void {
  animationCalls.length = 0;
}

export function createReanimatedMock() {
  const actual = jest.requireActual("react-native-reanimated");

  return {
    ...actual,
    __esModule: true,
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
