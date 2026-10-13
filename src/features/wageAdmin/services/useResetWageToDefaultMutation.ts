import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { resetWageToDefault } from "@/features/wageAdmin/api/resetWageToDefault.api";

export type ResetWageToDefaultResult = {
  mutate: (profileId: string, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useResetWageToDefaultMutation(
  client: DB,
): ResetWageToDefaultResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (profileId: string) => resetWageToDefault(client, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all }),
  });

  const send = useCallback(
    (profileId: string, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(profileId, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
