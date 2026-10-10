import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { removeRehearsal } from "@/features/rehearsalEdit/api/removeRehearsal.api";

export type RemoveRehearsalResult = {
  mutate: (id: string) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRemoveRehearsalMutation(client: DB): RemoveRehearsalResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (id: string) => removeRehearsal(client, id),
    onSuccess: () =>
      Promise.all(
        staleTogether.rehearsalWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (id: string) => {
      if (!isPending) {
        mutate(id);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
