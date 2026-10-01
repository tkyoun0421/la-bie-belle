import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { setDefaultWage } from "@/entities/payroll/dals/setDefaultWage";
import { PAYROLL_KEY } from "@/features/payroll/model/queryKeys";

/**
 * 기본 시급을 정한다. 한 번에 여러 사람의 행이 서므로(PAY-013) 성공한 뒤 `['payroll']`을
 * 무효화해야 목록의 그 사람들 줄이 같이 움직인다 — 빠뜨리면 관리자가 안 바뀐 줄 알고 또
 * 누른다.
 *
 * 화면이 확인을 안 묻는 자리라(PAY-011) 이 훅도 한 번 눌린 것을 그대로 보낸다.
 */

export type SetDefaultWageResult = {
  mutate: (amount: number) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetDefaultWage(client: DB): SetDefaultWageResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (amount: number) => setDefaultWage(client, amount),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PAYROLL_KEY });
    },
  });

  const save = useCallback(
    (amount: number) => {
      if (!isPending) {
        mutate(amount);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
