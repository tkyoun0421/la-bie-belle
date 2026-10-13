import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { setWage } from "@/features/wageAdmin/api/setWage.api";
import type { SetWageInput } from "@/features/wageAdmin/model/wageAdmin.type";

export type SetWageResult = {
  mutate: (input: SetWageInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetWageMutation(client: DB): SetWageResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: SetWageInput) => setWage(client, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all }),
  });

  const save = useCallback(
    (input: SetWageInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
