import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { decideEntry } from "@/features/auth/lib/decideEntry.lib";
import type { EntryDecision } from "@/features/auth/model/auth.type";

export type RetryEntryResult = {
  retry: (onDecided: (destination: EntryDecision) => void) => void;
  isPending: boolean;
};

export function useRetryEntryMutation(client: DB): RetryEntryResult {
  const { mutate, isPending } = useMutation({
    mutationFn: () => decideEntry({ client }),
  });

  const retry = useCallback(
    (onDecided: (destination: EntryDecision) => void) => {
      if (!isPending) {
        mutate(undefined, {
          onSuccess: (destination) => onDecided(destination),
        });
      }
    },
    [isPending, mutate],
  );

  return { retry, isPending };
}
