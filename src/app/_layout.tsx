import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import "@/app/globals.css";
import { queryClient } from "@/shared/api/queryClient";
import { supabase, supabaseConfigured } from "@/shared/api/supabase";
import { FONT_SOURCES } from "@/shared/consts/font.const";
import { trackReduceMotion } from "@/shared/lib/reduceMotion.lib";
import { followOsColorScheme } from "@/shared/lib/themeStorage.lib";
import type { FontLoadingState } from "@/shared/model/font.type";
import { useTheme } from "@/shared/stores/theme.store";
import { AppUnavailable } from "@/shared/ui/AppUnavailable";
import {
  shouldDismissSplash,
  shouldRenderApp,
} from "@/shared/utils/fontLoading.utils";
import { rootGateOf } from "@/shared/utils/rootGate.utils";
import { getServerNow } from "@/entities/clock/api/getServerNow.api";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { decideEntry } from "@/features/auth/lib/decideEntry.lib";
import { wireAutoRefresh } from "@/features/auth/lib/wireAutoRefresh.lib";
import type { EntryDecision } from "@/features/auth/model/auth.type";

SplashScreen.preventAutoHideAsync().catch(() => {});

type RootReadiness = FontLoadingState & {
  themeRestored: boolean;
};

export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_SOURCES);
  const themeRestored = useTheme((at) => at.restored);
  const restoreTheme = useTheme((at) => at.restore);

  useEffect(() => {
    void restoreTheme();
  }, [restoreTheme]);

  useEffect(() => followOsColorScheme(() => useTheme.getState().theme), []);

  const readiness = { loaded, error, themeRestored };

  if (rootGateOf({ configured: supabaseConfigured }) === "unavailable") {
    return <UnavailableRoot {...readiness} />;
  }

  return <ConfiguredRoot {...readiness} />;
}

function UnavailableRoot({ loaded, error, themeRestored }: RootReadiness) {
  const splashDismissed = useRef(false);

  useEffect(() => {
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
    SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error, themeRestored]);

  if (!shouldRenderApp({ loaded, error })) {
    return null;
  }

  return <AppUnavailable />;
}

function ConfiguredRoot({ loaded, error, themeRestored }: RootReadiness) {
  const router = useRouter();
  const [destination, setDestination] = useState<EntryDecision | null>(null);
  const splashDismissed = useRef(false);

  useEffect(() => wireAutoRefresh(supabase.auth), []);

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

    void Promise.all([
      decideEntry({ client: supabase }),
      trackReduceMotion(),
    ]).then(([decided]) => {
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
