import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";

import "@/app/globals.css";
import {
  FONT_SOURCES,
  shouldDismissSplash,
  shouldRenderApp,
} from "@/shared/lib/font-loading";
import { queryClient } from "@/shared/lib/query-client";
import { supabase } from "@/shared/lib/supabase";
import { wireAutoRefresh } from "@/shared/lib/wire-auto-refresh";
import { decideEntry, type EntryDecision } from "@/features/auth/decide-entry";

// 스플래시가 이미 내려간 뒤에 부르면 reject한다 — 그때는 막을 것도 없으니 삼킨다.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * 층 셋이 나란히 선다 — 게이트·근무자 탭·관리자([navigation.md]의 「세 층」).
 * 어느 층으로 가는지는 세션·프로필·승인 판정이 정하고, 그 판정은 이 껍데기
 * 하나가 decide-entry에 물어서 한다.
 *
 * 스플래시는 서체와 판정이 둘 다 끝난 뒤에 내린다. 서체만 기다리면 판정 전에
 * 잘못된 층이 한 프레임 비치고, 판정만 기다리면 시스템 서체로 그려진 글자가
 * Wanted Sans로 바뀌면서 눈에 보이게 튄다.
 *
 * 서버 상태가 사는 `queryClient`도 여기서 트리에 앉는다. 로그아웃이 비우는 쪽과 화면이
 * 읽는 쪽이 같은 하나여야 해서 그 인스턴스는 `shared/lib`이 들고 있고 여기는 걸기만 한다.
 */
export default function RootLayout() {
  const router = useRouter();
  const [loaded, error] = useFonts(FONT_SOURCES);
  const [destination, setDestination] = useState<EntryDecision | null>(null);
  const splashDismissed = useRef(false);

  useEffect(() => wireAutoRefresh(supabase.auth), []);

  useEffect(() => {
    let abandoned = false;

    void decideEntry({ client: supabase }).then((decided) => {
      if (!abandoned) {
        setDestination(decided);
      }
    });

    return () => {
      abandoned = true;
    };
  }, []);

  useEffect(() => {
    if (!destination) {
      return;
    }

    if (!shouldDismissSplash({ loaded, error }, splashDismissed.current)) {
      return;
    }

    splashDismissed.current = true;
    router.replace(destination);
    SplashScreen.hideAsync().catch(() => {});
  }, [destination, loaded, error, router]);

  if (!shouldRenderApp({ loaded, error })) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
