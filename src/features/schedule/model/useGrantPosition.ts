import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { grantPosition } from "@/entities/schedule/api/grantPosition.api";

/**
 * 자격 없는 사람 시트의 「자격도 주기」다. 이 훅만 `['members']`를 무효화한다
 * (`docs/2-design/modules/schedule/design.md`의 「자격 주기」) — 자격은 근무표가 아니라
 * 사람의 속성이고, `qualifications` 뷰가 그 아래 살아 픽커의 자격 판정도 같이 덮인다.
 *
 * 「자격도 주기」는 이 호출 뒤 `add_assignment`까지 둘이다. 한 트랜잭션이 아니라 앞이
 * 성공하고 뒤가 실패하면 자격만 남는데, 자격은 사람의 속성이라 그 상태가 틀린 것이 아니다.
 */

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

export function useGrantPosition(client: DB): GrantPositionResult {
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
