import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import {
  DEVICE_CLEANUP_NOT_WIRED_YET,
  signOut,
} from "@/features/auth/lib/signOut.lib";

export type SignOutResult = {
  signOut: (onDone: () => void) => void;
  isPending: boolean;
};

export function useSignOutMutation(client: DB): SignOutResult {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      signOut({
        ...DEVICE_CLEANUP_NOT_WIRED_YET,
        signOut: async () => {
          await client.auth.signOut();
        },
        clearQueryClient: () => queryClient.clear(),
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
