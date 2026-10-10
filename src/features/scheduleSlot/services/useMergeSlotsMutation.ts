import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { mergeSlots } from "@/features/scheduleSlot/api/mergeSlots.api";

export type MergeSlotsInput = {
  dayId: string;
  from: string;
  to: string;
};

export type MergeSlotsResult = {
  mutate: (input: MergeSlotsInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useMergeSlotsMutation(client: DB): MergeSlotsResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ dayId, from, to }: MergeSlotsInput) =>
      mergeSlots(client, dayId, from, to),
    onSuccess: () =>
      Promise.all(
        staleTogether.scheduleWrite.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });

  const send = useCallback(
    (input: MergeSlotsInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
