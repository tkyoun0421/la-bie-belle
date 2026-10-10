import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { createSchedule } from "@/features/scheduleDay/api/createSchedule.api";

export type CreateScheduleInput = {
  month: string;
  deadline: string;
};

export type CreateScheduleResult = {
  mutate: (input: CreateScheduleInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useCreateScheduleMutation(client: DB): CreateScheduleResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ month, deadline }: CreateScheduleInput) =>
      createSchedule(client, month, deadline),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: CreateScheduleInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
