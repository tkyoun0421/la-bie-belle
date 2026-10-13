import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { setRole } from "@/features/memberAdmin/api/setRole.api";

export type SetRoleInput = {
  profileId: string;
  role: string;
};

export type SetRoleResult = {
  mutate: (input: SetRoleInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetRoleMutation(client: DB): SetRoleResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId, role }: SetRoleInput) =>
      setRole(client, profileId, role),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
  });

  const send = useCallback(
    (input: SetRoleInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
