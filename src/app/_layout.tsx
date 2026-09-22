import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";

import "@/app/globals.css";
import {
  FONT_SOURCES,
  shouldDismissSplash,
  shouldRenderApp,
} from "@/shared/lib/font-loading";

// 스플래시가 이미 내려간 뒤에 부르면 reject한다 — 그때는 막을 것도 없으니 삼킨다.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * 층 셋이 나란히 선다 — 게이트·근무자 탭·관리자([navigation.md]의 「세 층」).
 * 어느 층으로 가는지는 세션·프로필·승인 판정이 정하고, 그 판정은
 * 이 껍데기 하나가 한다. 지금은 표가 없어 판정이 아직 안 붙었다.
 *
 * 서체를 불러오는 동안은 아무것도 안 그린다 — 기본 서체로 한 번 그린 뒤
 * Wanted Sans로 바뀌면 글자가 눈에 보이게 튄다.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_SOURCES);
  const splashDismissed = useRef(false);

  useEffect(() => {
    if (!shouldDismissSplash({ loaded, error }, splashDismissed.current)) {
      return;
    }

    splashDismissed.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!shouldRenderApp({ loaded, error })) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
