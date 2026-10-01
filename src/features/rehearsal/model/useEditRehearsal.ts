import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import {
  editRehearsal,
  type EditRehearsalInput,
} from "@/entities/rehearsal/dals/editRehearsal";

/**
 * 리허설 고치기다. 넣기와 같은 둘을 낡게 한다 — `['rehearsal']`과 `['payroll']`이고
 * **`['schedule']`은 안 건드린다**.
 */

export type EditRehearsalResult = {
  mutate: (input: EditRehearsalInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useEditRehearsal(client: DB): EditRehearsalResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: EditRehearsalInput) => editRehearsal(client, input),
    onSuccess: () => {
      for (const queryKey of staleTogether.rehearsalWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: EditRehearsalInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
