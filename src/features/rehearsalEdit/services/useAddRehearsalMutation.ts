import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import {
  addRehearsal,
  type AddRehearsalInput,
} from "@/features/rehearsalEdit/api/addRehearsal.api";

export type AddRehearsalResult = {
  mutate: (input: AddRehearsalInput) => void;
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
    (input: AddRehearsalInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
