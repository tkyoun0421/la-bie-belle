import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import {
  decideCancelRequest,
  type CancelDecision,
} from "@/entities/schedule/dals/decide-cancel-request";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/query-keys";

/**
 * 관리자가 근무 취소 요청을 승인하거나 거절한다. 승인이면 자리가 비므로 근무표와 급여가
 * 같이 낡고, 거절이어도 그 줄이 목록에서 빠지므로 요청을 다시 읽는다.
 *
 * **화면이 먼저 움직이지 않는다** — 근무자에게 알림이 나가고 승인은 자리를 비우는,
 * 되돌릴 수 없는 판정이다([낙관적 업데이트](../../../../docs/2-design/system/runtime.md#낙관적-업데이트)).
 */

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

export function useDecideCancelRequest(client: Db): DecideCancelRequestResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({
      cancelRequestId,
      decision,
      reason,
    }: DecideCancelRequestInput) =>
      decideCancelRequest(client, cancelRequestId, decision, reason),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
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
