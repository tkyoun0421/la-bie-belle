import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { APP_STATE } from "@/shared/lib/appState.lib";
import {
  getProfileNotificationRow,
  type ProfileNotificationRow,
} from "@/entities/notification/model/profileNotificationRow.policy";
import {
  getReachState,
  type PushPermission,
} from "@/entities/notification/model/reachState.policy";
import { PUSH_DEPS } from "@/features/pushSwitch/lib/pushDeps.lib";
import {
  getPushPermission,
  requestPushPermission,
} from "@/features/pushSwitch/lib/pushPermission.lib";
import { useNotificationSwitchMutation } from "@/features/pushSwitch/services/useNotificationSwitchMutation";
import { useSavePushTokenMutation } from "@/features/pushSwitch/services/useSavePushTokenMutation";

export type ProfileNotificationRowController = {
  row: ProfileNotificationRow;
  on: boolean;
  asking: boolean;
  flip: (next: boolean) => void;
  cancelTurnOff: () => void;
  confirmTurnOff: () => void;
};

export function useProfileNotificationRow(
  enabled: boolean | null,
): ProfileNotificationRowController {
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useSavePushTokenMutation(supabase, pushToken, APP_STATE);

  const askPushPermission = useCallback(async () => {
    const asked = await requestPushPermission(PUSH_DEPS);

    setPermission(asked.permission);

    if (asked.permission === "granted" && asked.token !== null) {
      setPushToken(asked.token);
    }

    return asked.permission === "granted";
  }, []);

  const notification = useNotificationSwitchMutation(
    supabase,
    enabled ?? false,
    askPushPermission,
  );

  useEffect(() => {
    void getPushPermission(PUSH_DEPS.getPermissionsAsync)
      .then(setPermission)
      .catch(() => {});
  }, []);

  const flip = useCallback(
    (next: boolean) => {
      if (next) {
        notification.turnOn();
        return;
      }

      setAsking(true);
    },
    [notification],
  );

  const confirmTurnOff = useCallback(() => {
    setAsking(false);
    notification.turnOff();
  }, [notification]);

  return {
    row: getProfileNotificationRow(
      getReachState({
        notificationsEnabled: enabled === null ? null : notification.enabled,
        hasDevice: permission === null ? null : permission === "granted",
        permission,
      }),
      notification.isPending,
    ),
    on: notification.enabled,
    asking,
    flip,
    cancelTurnOff: () => setAsking(false),
    confirmTurnOff,
  };
}
