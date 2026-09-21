import { Stack } from "expo-router";

import "@/app/globals.css";

/**
 * 층 셋이 나란히 선다 — 게이트·근무자 탭·관리자([navigation.md]의 「세 층」).
 * 어느 층으로 가는지는 세션·프로필·승인 판정이 정하고, 그 판정은
 * 이 껍데기 하나가 한다. 지금은 표가 없어 판정이 아직 안 붙었다.
 */
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
