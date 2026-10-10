import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { setDisplayName } from "@/features/memberAdmin/api/setDisplayName.api";

export type SetDisplayNameInput = {
  profileId: string;
  name: string;
};

export type SetDisplayNameResult = {
  mutate: (input: SetDisplayNameInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetDisplayNameMutation(client: DB): SetDisplayNameResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId, name }: SetDisplayNameInput) =>
      setDisplayName(client, profileId, name),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all }),
      ]),
  });

  const save = useCallback(
    (input: SetDisplayNameInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
