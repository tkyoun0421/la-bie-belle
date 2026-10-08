import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { forceChange } from "@/features/scheduleConfirm/api/forceChange.api";

export type ForceChangeInput = {
  assignmentId: string;
  profileId: string;
};

export type ForceChangeResult = {
  mutate: (input: ForceChangeInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useForceChangeMutation(client: DB): ForceChangeResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ assignmentId, profileId }: ForceChangeInput) =>
      forceChange(client, assignmentId, profileId),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: ForceChangeInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
