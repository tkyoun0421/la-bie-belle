import { AccessibilityInfo } from "react-native";

export async function motionDistance(
  distance: number,
  isReduceMotionEnabled: () => Promise<boolean> = () =>
    AccessibilityInfo.isReduceMotionEnabled(),
): Promise<number> {
  return (await isReduceMotionEnabled()) ? 0 : distance;
}
