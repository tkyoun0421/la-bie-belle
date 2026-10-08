import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import {
  editRehearsal,
  type EditRehearsalInput,
} from "@/features/rehearsalEdit/api/editRehearsal.api";

export type EditRehearsalResult = {
  mutate: (input: EditRehearsalInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useEditRehearsalMutation(client: DB): EditRehearsalResult {
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
