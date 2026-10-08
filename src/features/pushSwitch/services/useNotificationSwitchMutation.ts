import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { setNotificationsEnabled } from "@/features/pushSwitch/api/setNotificationsEnabled.api";

export type NotificationSwitch = {
  enabled: boolean;
  isPending: boolean;
  turnOn: () => void;
  turnOff: () => void;
};

export function useNotificationSwitchMutation(
  client: DB,
  currentEnabled: boolean,
  requestPermission: () => Promise<boolean>,
): NotificationSwitch {
  const queryClient = useQueryClient();
  const [wanted, setWanted] = useState<boolean | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (on: boolean) => {
      await setNotificationsEnabled(client, on);

      if (on) {
        await requestPermission();
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
    onError: () => setWanted(null),
  });

  const flip = useCallback(
    (on: boolean) => {
      if (isPending) {
        return;
      }

      setWanted(on);
      mutate(on);
    },
    [isPending, mutate],
  );

  const turnOn = useCallback(() => flip(true), [flip]);
  const turnOff = useCallback(() => flip(false), [flip]);

  return { enabled: wanted ?? currentEnabled, isPending, turnOn, turnOff };
}
