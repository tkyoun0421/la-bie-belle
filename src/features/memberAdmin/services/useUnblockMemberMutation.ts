import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { unblockMember } from "@/features/memberAdmin/api/unblockMember.api";

/**
 * 차단을 푼다. 정본은 같은 문서의 「차단한 사람」이다.
 *
 * 풀면 그 사람이 다시 가입 대기로 서고 지난 값이 굳은 채로 남는다.
 *
 * **무효화가 `['members']` 하나다.** 네 목록(재직·퇴사·가입 대기·차단)이 그 접두사 아래
 * 같이 살아 판정 하나가 둘씩 움직인다(`account/design.md`의 「캐시 갱신」).
 *
 * 늦게 누른 쪽은 `already_decided`를 받는다 — 그 말을 하는 것은 화면이다.
 */

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
