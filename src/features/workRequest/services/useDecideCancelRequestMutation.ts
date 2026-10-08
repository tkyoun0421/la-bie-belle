import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { type CancelDecision } from "@/entities/workRequest/model/workRequest.type";
import { decideCancelRequest } from "@/features/workRequest/api/decideCancelRequest.api";

export type DecideCancelRequestInput = {
  cancelRequestId: string;
  decision: CancelDecision;
  reason?: string;
};

export type DecideCancelRequestResult = {
  mutate: (input: DecideCancelRequestInput) => void;
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
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: DecideCancelRequestInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
