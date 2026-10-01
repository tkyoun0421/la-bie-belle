import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import "@/app/globals.css";
import {
  FONT_SOURCES,
  shouldDismissSplash,
  shouldRenderApp,
} from "@/shared/lib/fontLoading";
import { queryClient } from "@/shared/lib/queryClient";
import { serverClockStore } from "@/shared/lib/serverClockStore";
import { supabase } from "@/shared/lib/supabase";
import { useTheme } from "@/shared/lib/useTheme";
import { wireAutoRefresh } from "@/shared/lib/wireAutoRefresh";
import { getServerNow } from "@/entities/clock/api/getServerNow.api";
import { decideEntry, type EntryDecision } from "@/features/auth/decideEntry";

// 스플래시가 이미 내려간 뒤에 부르면 reject한다 — 그때는 막을 것도 없으니 삼킨다.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * 층 셋이 나란히 선다 — 게이트·근무자 탭·관리자([navigation.md]의 「세 층」).
 * 어느 층으로 가는지는 세션·프로필·승인 판정이 정하고, 그 판정은 이 껍데기
 * 하나가 decide-entry에 물어서 한다.
 *
 * 스플래시는 서체와 판정과 테마 복원이 다 끝난 뒤에 내린다. 서체만 기다리면 판정
 * 전에 잘못된 층이 한 프레임 비치고, 판정만 기다리면 시스템 서체로 그려진 글자가
 * Wanted Sans로 바뀌면서 눈에 보이게 튄다. 테마를 안 기다리면 어둡게 고른 사람이
 * 흰 화면을 한 번 보고 나서 어두워진다
 * ([profile.md](../../docs/2-design/modules/account/screens/profile.md)의 「화면」).
 *
 * 서버 상태가 사는 `queryClient`도 여기서 트리에 앉는다. 로그아웃이 비우는 쪽과 화면이
 * 읽는 쪽이 같은 하나여야 해서 그 인스턴스는 `shared/lib`이 들고 있고 여기는 걸기만 한다.
 *
 * **서버 시각 오프셋은 스플래시를 안 기다린다.** 앱이 뜰 때와 앞으로 돌아올 때 한 번씩
 * 재는데([runtime.md](../../docs/2-design/system/runtime.md#서버-시각)) 그 답을 기다리면
 * 통신이 느린 자리에서 앱이 스플래시에 갇힌다 — 지난번에 잰 차이를 먼저 깔고 답이 오면
 * 덮는다. 시각은 보여주기용이고 판정은 함수의 `now()`가 한다.
 */
export default function RootLayout() {
  const router = useRouter();
  const [loaded, error] = useFonts(FONT_SOURCES);
  const [destination, setDestination] = useState<EntryDecision | null>(null);
  const splashDismissed = useRef(false);
  const themeRestored = useTheme((at) => at.restored);
  const restoreTheme = useTheme((at) => at.restore);

  useEffect(() => wireAutoRefresh(supabase.auth), []);

  useEffect(() => {
    void restoreTheme();
  }, [restoreTheme]);

  useEffect(() => {
    const clock = serverClockStore.getState();

    void clock.restore();

    const sync = () => {
      void getServerNow(supabase)
        .then((iso) => clock.adopt(iso, Date.now()))
        .catch(() => {});
    };

    sync();

    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        sync();
      }
    });

    return () => subscription.remove();
  }, []);

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

    if (
      !shouldDismissSplash(
        { loaded, error },
        splashDismissed.current,
        themeRestored,
      )
    ) {
      return;
    }

    splashDismissed.current = true;
    router.replace(destination);
    SplashScreen.hideAsync().catch(() => {});
  }, [destination, loaded, error, themeRestored, router]);

  if (!shouldRenderApp({ loaded, error })) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
