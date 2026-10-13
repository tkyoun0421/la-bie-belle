import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { setDefaultWage } from "@/features/wageAdmin/api/setDefaultWage.api";

export type SetDefaultWageResult = {
  mutate: (amount: number, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetDefaultWageMutation(client: DB): SetDefaultWageResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (amount: number) => setDefaultWage(client, amount),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all }),
  });

  const save = useCallback(
    (amount: number, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(amount, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
