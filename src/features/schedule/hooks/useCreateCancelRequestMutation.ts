import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { createCancelRequest } from "@/entities/schedule/api/createCancelRequest.api";

/**
 * 근무자가 자기 근무를 취소해 달라고 낸다. 근무는 아직 그대로지만 그 배정에 「취소 요청 중」이
 * 서고 버튼 둘이 닫히므로 근무표도 같이 낡게 한다.
 */

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

export function useCreateCancelRequest(client: DB): CreateCancelRequestResult {
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
