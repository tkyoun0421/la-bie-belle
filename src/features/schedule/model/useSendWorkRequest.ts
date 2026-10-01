import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { sendWorkRequest } from "@/entities/schedule/dals/sendWorkRequest";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/queryKeys";

/**
 * 관리자가 고른 사람들에게 빈 자리의 근무를 물어본다. 보낸 뒤 자리 카드에 배지가 서고
 * 픽커의 그 줄들이 「요청 대기 중」이 되므로 근무표와 요청을 같이 낡게 한다.
 */

export type SendWorkRequestInput = {
  slotId: string;
  profileIds: readonly string[];
};

export type SendWorkRequestResult = {
  mutate: (input: SendWorkRequestInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSendWorkRequest(client: DB): SendWorkRequestResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ slotId, profileIds }: SendWorkRequestInput) =>
      sendWorkRequest(client, slotId, profileIds),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: SendWorkRequestInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
