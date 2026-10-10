import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { openDay } from "@/features/scheduleDay/api/openDay.api";

export type OpenDayInput = {
  workDate: string;
};

export type OpenDayResult = {
  mutate: (input: OpenDayInput) => void;
  mutateAsync: (input: OpenDayInput) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useOpenDayMutation(client: DB): OpenDayResult {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isSuccess, isError, error, reset } =
    useMutation({
      mutationFn: ({ workDate }: OpenDayInput) => openDay(client, workDate),
      onSuccess: () =>
        Promise.all(
          staleTogether.scheduleWrite.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        ),
    });

  const send = useCallback(
    (input: OpenDayInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return {
    mutate: send,
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  };
}
