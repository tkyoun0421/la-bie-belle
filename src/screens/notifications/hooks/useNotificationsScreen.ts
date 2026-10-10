import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { supabase } from "@/shared/api/supabase";
import { WORKER_HOME_PATH } from "@/shared/consts/navigation.const";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import type { NotificationPick } from "@/entities/notification/hooks/useNotificationsList";
import { useMarkNotificationsReadMutation } from "@/features/notificationRead/services/useMarkNotificationsReadMutation";
import { pressNotification } from "@/screens/notifications/hooks/pressNotification";

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
  const serverNowMs = useServerNow();
  const now = new Date(serverNowMs);

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
