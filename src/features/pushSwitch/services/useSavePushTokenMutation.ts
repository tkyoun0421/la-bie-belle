import { useEffect, useRef } from "react";
import type { AppStateStatus } from "react-native";
import type { DB } from "@/shared/api/database";
import { isForegroundEntry } from "@/entities/notification/model/appEntry.policy";
import { savePushToken } from "@/features/pushSwitch/api/savePushToken.api";

type AppStateSource = {
  addEventListener: (
    event: "change",
    listener: (state: AppStateStatus) => void,
  ) => { remove: () => void };
};

const MOUNTED_AS_ACTIVE: AppStateStatus = "active";

export function useSavePushTokenMutation(
  client: DB,
  token: string | null,
  appState: AppStateSource,
): void {
  const latest = useRef(token);

  useEffect(() => {
    latest.current = token;

    if (token === null) {
      return;
    }

    void savePushToken(client, token).catch(() => {});
  }, [client, token]);

  useEffect(() => {
    let previous: AppStateStatus = MOUNTED_AS_ACTIVE;

    const subscription = appState.addEventListener("change", (next) => {
      const entered = isForegroundEntry(previous, next);
      previous = next;

      const current = latest.current;

      if (!entered || current === null) {
        return;
      }

      void savePushToken(client, current).catch(() => {});
    });

    return () => subscription.remove();
  }, [client, appState]);
}
