import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  setHoliday,
  type SetHolidayInput,
} from "@/entities/payroll/api/setHoliday.api";

/**
 * 임시공휴일을 켜고 끈다. 값이 급여 쪽 표로 가므로 무효화도 `['payroll']`이다
 * (`docs/2-design/system/runtime.md`의 「무효화 표」).
 *
 * **낙관적으로 안 칠한다.** 스위치가 먼저 넘어가면 거절이 왔을 때 되돌아가는 그림이 서고,
 * 받아온 공휴일인 날은 애초에 잠겨 있어 여기까지 오지 않는다.
 *
 * **거절을 안 삼킨다.** 관리자가 아닌 손이 부르면 `not_allowed`가 그대로 올라온다.
 */

export type SetHolidayResult = {
  mutate: (input: SetHolidayInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetHoliday(client: DB): SetHolidayResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: SetHolidayInput) => setHoliday(client, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });

  const toggle = useCallback(
    (input: SetHolidayInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: toggle, isPending, isSuccess, isError, error, reset };
}
