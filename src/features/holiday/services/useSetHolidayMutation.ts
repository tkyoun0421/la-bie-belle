import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  setHoliday,
  type SetHolidayInput,
} from "@/features/holiday/api/setHoliday.api";

export type SetHolidayResult = {
  mutate: (input: SetHolidayInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetHolidayMutation(client: DB): SetHolidayResult {
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
