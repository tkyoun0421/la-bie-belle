import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { setApplicationDeadline } from "@/features/availabilitySubmit/api/setApplicationDeadline.api";

export type SetApplicationDeadlineInput = {
  month: string;
  deadline: string;
};

export type SetApplicationDeadlineResult = {
  mutate: (input: SetApplicationDeadlineInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetApplicationDeadlineMutation(
  client: DB,
): SetApplicationDeadlineResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ month, deadline }: SetApplicationDeadlineInput) =>
      setApplicationDeadline(client, month, deadline),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: SetApplicationDeadlineInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
