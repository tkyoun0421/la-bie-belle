import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { NEXT_PAGE_SLACK } from "@/screens/notifications/consts/notifications.const";

/**
 * 스크롤이 바닥에서 한 칸 남았는지 잰다. 재는 값이 전부 기기가 그려 놓은 길이라
 * (`contentOffset`·`layoutMeasurement`·`contentSize`) 측정하는 쪽은 화면이고, 그 답을 받아
 * 다음 쪽을 부를지 정하는 것은 controller다 — `.tsx`가 둘을 한 줄에서 하고 있었다.
 *
 * `react-native` import가 타입뿐이라 이 파일은 SDK에 안 닿는다.
 */

export function nearBottom(
  event: NativeSyntheticEvent<NativeScrollEvent>,
): boolean {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

  return (
    contentOffset.y + layoutMeasurement.height >=
    contentSize.height - NEXT_PAGE_SLACK
  );
}
