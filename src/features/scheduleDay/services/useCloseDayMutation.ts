import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { closeDay } from "@/features/scheduleDay/api/closeDay.api";

export type CloseDayInput = {
  workDate: string;
};

export type CloseDayResult = {
  mutate: (input: CloseDayInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useCloseDayMutation(client: DB): CloseDayResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ workDate }: CloseDayInput) => closeDay(client, workDate),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: CloseDayInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
