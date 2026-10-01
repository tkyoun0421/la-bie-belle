import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  setAdjustment,
  type SetAdjustmentInput,
} from "@/features/adjustment/api/setAdjustment.api";

/**
 * 그날 그 사람의 근무 시간을 조정한다. 응답을 기다린다 — 고치는 자리가 시트 안이고 그날 배정이
 * 사라졌으면 거절이 와야 목록을 다시 읽는다.
 *
 * **거절을 안 삼킨다.** `not_allowed`는 배정이 없어졌다는 말이라 시트가 그것으로 다음 손을
 * 고른다(`adjustmentFailure.ts`).
 *
 * **사유는 화면이 고른 갈래 이름 그대로 간다** — 「결근」·「연장」·「원래대로」 셋이다
 * (`docs/2-design/modules/payroll/design.md`의 「조정」).
 *
 * **보내는 중에 또 보내지 않는다.** 고르기 시트의 줄은 한 번 누르면 바로 나가는 자리라 두 번
 * 눌리는 경로를 여기서 막는다.
 */

export type SetAdjustmentResult = {
  mutate: (input: SetAdjustmentInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetAdjustmentMutation(client: DB): SetAdjustmentResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: SetAdjustmentInput) => setAdjustment(client, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });

  const save = useCallback(
    (input: SetAdjustmentInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
