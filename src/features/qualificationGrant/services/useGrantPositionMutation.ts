import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { grantPosition } from "@/features/qualificationGrant/api/grantPosition.api";

export type GrantPositionInput = {
  profileId: string;
  position: string;
};

export type GrantPositionResult = {
  mutate: (input: GrantPositionInput) => void;
  mutateAsync: (input: GrantPositionInput) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useGrantPositionMutation(client: DB): GrantPositionResult {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isSuccess, isError, error, reset } =
    useMutation({
      mutationFn: ({ profileId, position }: GrantPositionInput) =>
        grantPosition(client, profileId, position),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.member.all });
      },
    });

  const send = useCallback(
    (input: GrantPositionInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return {
    mutate: send,
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  };
}
