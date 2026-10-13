import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { setDayHours } from "@/features/scheduleDay/api/setDayHours.api";

export type SetDayHoursInput = {
  workDate: string;
  starts: string;
  ends: string;
};

export type SetDayHoursResult = {
  mutate: (input: SetDayHoursInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetDayHoursMutation(client: DB): SetDayHoursResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ workDate, starts, ends }: SetDayHoursInput) =>
      setDayHours(client, workDate, starts, ends),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: SetDayHoursInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
