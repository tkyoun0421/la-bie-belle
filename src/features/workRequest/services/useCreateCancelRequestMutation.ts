import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { createCancelRequest } from "@/features/workRequest/api/createCancelRequest.api";

export type CreateCancelRequestInput = {
  assignmentId: string;
  reason: string;
};

export type CreateCancelRequestResult = {
  mutate: (input: CreateCancelRequestInput) => void;
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
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: CreateCancelRequestInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
