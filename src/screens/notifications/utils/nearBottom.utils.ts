import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { NEXT_PAGE_SLACK } from "@/screens/notifications/consts/notifications.const";

export function nearBottom(
  event: NativeSyntheticEvent<NativeScrollEvent>,
): boolean {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

  return (
    contentOffset.y + layoutMeasurement.height >=
    contentSize.height - NEXT_PAGE_SLACK
  );
}
