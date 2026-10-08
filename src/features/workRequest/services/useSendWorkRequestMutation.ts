import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { sendWorkRequest } from "@/features/workRequest/api/sendWorkRequest.api";

export type SendWorkRequestInput = {
  slotId: string;
  profileIds: readonly string[];
};

export type SendWorkRequestResult = {
  mutate: (input: SendWorkRequestInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSendWorkRequestMutation(client: DB): SendWorkRequestResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ slotId, profileIds }: SendWorkRequestInput) =>
      sendWorkRequest(client, slotId, profileIds),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: SendWorkRequestInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
