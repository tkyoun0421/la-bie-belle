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
let tracking = false;
let heardChange = false;

export const REDUCE_MOTION_SOURCE: ReduceMotionSource = {
  isReduceMotionEnabled: () => AccessibilityInfo.isReduceMotionEnabled(),
  addEventListener: (event, listener) =>
    AccessibilityInfo.addEventListener(event, listener),
  lastKnownReduceMotion: () => lastKnown,
};

function follow(enabled: boolean): void {
  heardChange = true;
  lastKnown = enabled;
}

export function trackReduceMotion(): Promise<void> {
  if (!tracking) {
    tracking = true;
    AccessibilityInfo.addEventListener("reduceMotionChanged", follow);
  }

  return AccessibilityInfo.isReduceMotionEnabled().then(
    (enabled) => {
      if (!heardChange) {
        lastKnown = enabled;
      }
    },
    () => {},
  );
}
