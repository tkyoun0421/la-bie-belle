import { useSuspenseQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { countUnreadNotifications } from "@/entities/notification/api/countUnreadNotifications.api";

export function useUnreadCountSuspenseQuery(client: DB) {
  return useSuspenseQuery({
    queryKey: queryKeys.notification.unread(),
    queryFn: () => countUnreadNotifications(client),
  });
}
