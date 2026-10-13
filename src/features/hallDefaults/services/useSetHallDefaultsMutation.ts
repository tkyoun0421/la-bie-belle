import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { setHallDefaults } from "@/features/hallDefaults/api/setHallDefaults.api";
import type { HallDefaultsInput } from "@/features/hallDefaults/model/hallDefaults.type";

export type SetHallDefaultsResult = {
  mutate: (input: HallDefaultsInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetHallDefaultsMutation(client: DB): SetHallDefaultsResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: HallDefaultsInput) => setHallDefaults(client, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.hall.all }),
  });

  const send = useCallback(
    (input: HallDefaultsInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
