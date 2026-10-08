import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { submitAvailability } from "@/features/availabilitySubmit/api/submitAvailability.api";

export type SubmitAvailabilityInput = {
  month: string;
  dates: string[];
};

export type SubmitAvailabilityResult = {
  mutate: (input: SubmitAvailabilityInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSubmitAvailabilityMutation(
  client: DB,
): SubmitAvailabilityResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ month, dates }: SubmitAvailabilityInput) =>
      submitAvailability(client, month, dates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.all }),
  });

  const send = useCallback(
    (input: SubmitAvailabilityInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
