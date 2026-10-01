import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { setDayHours } from "@/entities/schedule/api/setDayHours.api";

/**
 * 그 날의 근무 시간을 고친다. 끝이 시작보다 이르면 시트의 버튼이 먼저 막지만, 벽은
 * 누르는 시점에 서버가 다시 세운다 — `bad_hours`다.
 */

export type SetDayHoursInput = {
  workDate: string;
  starts: string;
  ends: string;
};

export type SetDayHoursResult = {
  mutate: (input: SetDayHoursInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetDayHours(client: DB): SetDayHoursResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ workDate, starts, ends }: SetDayHoursInput) =>
      setDayHours(client, workDate, starts, ends),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: SetDayHoursInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
