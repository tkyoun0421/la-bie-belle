import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { setWage, type SetWageInput } from "@/entities/payroll/dals/setWage";

/**
 * 한 사람의 시급을 정한다. 응답을 기다린다 — 고치는 자리가 시트 안이라 실패를 그 자리에
 * 세워야 하고, 먼저 칠해 두면 시트가 닫힌 뒤에 값이 되돌아간다.
 *
 * **거절을 안 삼킨다.** `bad_amount`는 표의 상한을 화면 너머에서 다시 막는 방어선이라
 * 그대로 올라와야 시트가 문구를 고른다.
 *
 * **보내는 중에 또 보내지 않는다.** 저장 버튼이 잠기는 것은 그림이고, 두 번 눌리는 경로를
 * 막는 것은 이 자리다.
 */

export type SetWageResult = {
  mutate: (input: SetWageInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetWage(client: DB): SetWageResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: SetWageInput) => setWage(client, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });

  const save = useCallback(
    (input: SetWageInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
