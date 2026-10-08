import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { type RequestAnswer } from "@/entities/workRequest/model/workRequest.type";
import { respondRequest } from "@/features/workRequest/api/respondRequest.api";

export type RespondRequestInput = {
  requestId: string;
  answer: RequestAnswer;
};

export type RespondRequestResult = {
  mutate: (input: RespondRequestInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRespondRequestMutation(client: DB): RespondRequestResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ requestId, answer }: RespondRequestInput) =>
      respondRequest(client, requestId, answer),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: RespondRequestInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
