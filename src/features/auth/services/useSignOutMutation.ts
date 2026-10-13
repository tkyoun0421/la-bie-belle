import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { clearStoredOffset } from "@/entities/clock/lib/clockStorage.lib";
import { removePushToken } from "@/features/auth/api/removePushToken.api";
import { readGrantedPushToken } from "@/features/auth/lib/devicePushToken.lib";
import { signOut } from "@/features/auth/lib/signOut.lib";

export type SignOutResult = {
  signOut: (onDone: () => void) => void;
  isPending: boolean;
};

async function removeDevicePushToken(client: DB): Promise<void> {
  const token = await readGrantedPushToken();

  if (token === null) {
    return;
  }

  await removePushToken(client, token).catch(() => {});
}

export function useSignOutMutation(client: DB): SignOutResult {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      signOut({
        removePushToken: () => removeDevicePushToken(client),
        signOut: async () => {
          await client.auth.signOut();
        },
        clearQueryClient: () => queryClient.clear(),
        clearPersistedState: clearStoredOffset,
      }),
  });

  const send = useCallback(
    (onDone: () => void) => {
      if (!isPending) {
        mutate(undefined, { onSuccess: onDone });
      }
    },
    [isPending, mutate],
  );

  return { signOut: send, isPending };
}
