import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { resetWageToDefault } from "@/entities/payroll/dals/resetWageToDefault";

/**
 * 한 사람을 다시 기본 끈에 붙인다(PAY-014). 오늘부터 적용되고 지난 행은 그대로 남는다.
 *
 * **`no_default_wage`를 삼키지 않는다.** 화면이 기본 시급이 없는 동안 되돌리기 줄을 안
 * 그려서 평소엔 안 보이는 거절이지만, 남은 방어선이 제 문구를 가지려면 그대로 올라와야
 * 한다(wages.md 「시급 문안」).
 */

export type ResetWageToDefaultResult = {
  mutate: (profileId: string) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useResetWageToDefault(client: DB): ResetWageToDefaultResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (profileId: string) => resetWageToDefault(client, profileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });

  const send = useCallback(
    (profileId: string) => {
      if (!isPending) {
        mutate(profileId);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
