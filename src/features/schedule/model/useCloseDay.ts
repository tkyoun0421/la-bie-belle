import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { closeDay } from "@/entities/schedule/dals/close-day";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/query-keys";

/**
 * 날 하나를 닫는다. 배정이 있으면 화면이 먼저 경고 시트로 확인받고 이 훅은 그 뒤에 불린다
 * (`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「날 닫기 경고」).
 */

export type CloseDayInput = {
  workDate: string;
};

export type CloseDayResult = {
  mutate: (input: CloseDayInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useCloseDay(client: Db): CloseDayResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ workDate }: CloseDayInput) => closeDay(client, workDate),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: CloseDayInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
