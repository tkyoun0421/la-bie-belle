import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { removeRehearsal } from "@/features/rehearsalEdit/api/removeRehearsal.api";

/**
 * 리허설 지우기다. 넣기·고치기와 같은 둘을 낡게 한다 — `['rehearsal']`과 `['payroll']`이고
 * **`['schedule']`은 안 건드린다**.
 */

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
    onSuccess: () => {
      for (const queryKey of staleTogether.rehearsalWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
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
