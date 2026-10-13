import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { type CancelDecision } from "@/entities/workRequest/model/workRequest.type";
import { decideCancelRequest } from "@/features/workRequest/api/decideCancelRequest.api";

export type DecideCancelRequestInput = {
  cancelRequestId: string;
  decision: CancelDecision;
  reason?: string;
};

export type DecideCancelRequestResult = {
  mutate: (
    input: DecideCancelRequestInput,
    callbacks?: MutationCallbacks,
  ) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useDecideCancelRequestMutation(
  client: DB,
): DecideCancelRequestResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({
      cancelRequestId,
      decision,
      reason,
    }: DecideCancelRequestInput) =>
      decideCancelRequest(client, cancelRequestId, decision, reason),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: DecideCancelRequestInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
