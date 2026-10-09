import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { supabase } from "@/shared/api/supabase";
import { WORKER_HOME_PATH } from "@/shared/consts/navigation.const";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import type { NotificationPick } from "@/entities/notification/hooks/useNotificationsList";
import { useMarkNotificationsReadMutation } from "@/features/notificationRead/services/useMarkNotificationsReadMutation";
import { pressNotification } from "@/screens/notifications/model/pressNotification.policy";

export type NotificationsScreenController = {
  now: Date;
  goBack: () => void;
  pressRow: (picked: NotificationPick) => void;
  markNotices: (ids: string[]) => void;
};

export function useNotificationsScreen(
  from?: string,
): NotificationsScreenController {
  const router = useRouter();
  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset));

  const { mutate: markRead, mutateAsync: markReadAsync } =
    useMarkNotificationsReadMutation(supabase);

  const pressRow = useCallback(
    ({ ids, destination }: NotificationPick) =>
      void pressNotification({
        ids,
        destination,
        navigate: (to) => router.push(to as Href),
        markRead: markReadAsync,
      }),
    [router, markReadAsync],
  );

  const markNotices = useCallback((ids: string[]) => markRead(ids), [markRead]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace((from ?? WORKER_HOME_PATH) as Href);
  }, [router, from]);

  return { now, goBack, pressRow, markNotices };
}
