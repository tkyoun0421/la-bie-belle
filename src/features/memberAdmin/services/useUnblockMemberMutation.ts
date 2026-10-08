import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { unblockMember } from "@/features/memberAdmin/api/unblockMember.api";

export type UnblockMemberInput = {
  profileId: string;
};

export type UnblockMemberResult = {
  mutate: (input: UnblockMemberInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useUnblockMemberMutation(client: DB): UnblockMemberResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId }: UnblockMemberInput) =>
      unblockMember(client, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
  });

  const send = useCallback(
    (input: UnblockMemberInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
