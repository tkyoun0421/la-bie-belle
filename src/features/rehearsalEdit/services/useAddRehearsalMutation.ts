import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { addRehearsal } from "@/features/rehearsalEdit/api/addRehearsal.api";
import type { AddRehearsalInput } from "@/features/rehearsalEdit/model/rehearsalEdit.type";

export type AddRehearsalResult = {
  mutate: (input: AddRehearsalInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useAddRehearsalMutation(client: DB): AddRehearsalResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: AddRehearsalInput) => addRehearsal(client, input),
    onSuccess: () =>
      Promise.all(
        staleTogether.rehearsalWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: AddRehearsalInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
