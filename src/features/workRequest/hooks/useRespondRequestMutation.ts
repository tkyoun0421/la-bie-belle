import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import {
  respondRequest,
  type RequestAnswer,
} from "@/features/workRequest/api/respondRequest.api";

/**
 * 근무자가 받은 요청에 답한다. 수락이 곧 배정이라 근무표와 급여와 요청이 같이 낡는다.
 *
 * **응답을 기다린다**([경쟁 조건 기본값](../../../../docs/2-design/system/runtime.md#경쟁-조건-기본값)).
 * 보내는 동안 다시 눌러도 두 번 안 나간다 — 선착순이 걸린 자리라 두 번 보내면 무엇이
 * 통과했는지가 화면에서 안 갈린다.
 */

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
