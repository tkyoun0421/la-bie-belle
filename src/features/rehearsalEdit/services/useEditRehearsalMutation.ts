import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import {
  editRehearsal,
  type EditRehearsalInput,
} from "@/features/rehearsalEdit/api/editRehearsal.api";

export type EditRehearsalResult = {
  mutate: (input: EditRehearsalInput, callbacks?: MutationCallbacks) => void;
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
    onSuccess: () =>
      Promise.all(
        staleTogether.rehearsalWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: EditRehearsalInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
