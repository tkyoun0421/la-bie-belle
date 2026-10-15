import { AccessibilityInfo } from "react-native";

export type ReduceMotionSource = {
  isReduceMotionEnabled: () => Promise<boolean>;
  addEventListener: (
    event: "reduceMotionChanged",
    listener: (enabled: boolean) => void,
  ) => { remove: () => void };
  lastKnownReduceMotion?: () => boolean | undefined;
};

let lastKnown: boolean | undefined;

function remember(enabled: boolean): boolean {
  lastKnown = enabled;

  return enabled;
}

export const REDUCE_MOTION_SOURCE: ReduceMotionSource = {
  isReduceMotionEnabled: () =>
    AccessibilityInfo.isReduceMotionEnabled().then(remember),
  addEventListener: (event, listener) =>
    AccessibilityInfo.addEventListener(event, (enabled) =>
      listener(remember(enabled)),
    ),
  lastKnownReduceMotion: () => lastKnown,
};

export function primeReduceMotion(): Promise<void> {
  return REDUCE_MOTION_SOURCE.isReduceMotionEnabled().then(
    () => {},
    () => {},
  );
}
