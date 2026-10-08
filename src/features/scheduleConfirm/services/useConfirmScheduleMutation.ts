import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { DomainError } from "@/shared/model/error.type";
import { confirmSchedule } from "@/features/scheduleConfirm/api/confirmSchedule.api";

export type ConfirmScheduleInput = {
  month: string;
};

export type ConfirmScheduleResult = {
  mutate: (input: ConfirmScheduleInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

function isAlreadyConfirmed(error: unknown): boolean {
  return error instanceof DomainError && error.code === "already_confirmed";
}

export function useConfirmScheduleMutation(client: DB): ConfirmScheduleResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: async ({ month }: ConfirmScheduleInput) => {
      try {
        await confirmSchedule(client, month);
      } catch (thrown) {
        if (!isAlreadyConfirmed(thrown)) {
          throw thrown;
        }
      }
    },
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: ConfirmScheduleInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
