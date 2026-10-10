import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  setWage,
  type SetWageInput,
} from "@/features/wageAdmin/api/setWage.api";

export type SetWageResult = {
  mutate: (input: SetWageInput) => void;
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
    (input: SetWageInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
