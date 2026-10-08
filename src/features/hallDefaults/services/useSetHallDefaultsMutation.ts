import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  setHallDefaults,
  type HallDefaultsInput,
} from "@/features/hallDefaults/api/setHallDefaults.api";

export type SetHallDefaultsResult = {
  mutate: (input: HallDefaultsInput) => void;
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
    (input: HallDefaultsInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
