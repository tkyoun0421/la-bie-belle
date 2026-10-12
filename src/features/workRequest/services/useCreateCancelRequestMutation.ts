import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { createCancelRequest } from "@/features/workRequest/api/createCancelRequest.api";

export type CreateCancelRequestInput = {
  assignmentId: string;
  reason: string;
};

export type CreateCancelRequestResult = {
  mutate: (
    input: CreateCancelRequestInput,
    callbacks?: MutationCallbacks,
  ) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useCreateCancelRequestMutation(
  client: DB,
): CreateCancelRequestResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ assignmentId, reason }: CreateCancelRequestInput) =>
      createCancelRequest(client, assignmentId, reason),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: CreateCancelRequestInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
