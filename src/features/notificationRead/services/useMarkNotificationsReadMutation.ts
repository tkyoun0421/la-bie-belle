import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { markNotificationsRead } from "@/features/notificationRead/api/markNotificationsRead.api";

export function useMarkNotificationsReadMutation(client: DB) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(client, ids),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notification.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notification.unread(),
        }),
      ]),
  });
}
