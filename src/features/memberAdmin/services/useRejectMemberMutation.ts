import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { rejectMember } from "@/features/memberAdmin/api/rejectMember.api";

/**
 * 가입 신청을 돌려보낸다. 정본은 같은 문서의 「안 받기」다.
 *
 * **차단과 갈린다** — 돌려보낸 사람은 고쳐서 다시 보낼 수 있다.
 *
 * **무효화가 `['members']` 하나다.** 네 목록(재직·퇴사·가입 대기·차단)이 그 접두사 아래
 * 같이 살아 판정 하나가 둘씩 움직인다(`account/design.md`의 「캐시 갱신」).
 *
 * 늦게 누른 쪽은 `already_decided`를 받는다 — 그 말을 하는 것은 화면이다.
 */

export type RejectMemberInput = {
  profileId: string;
};

export type RejectMemberResult = {
  mutate: (input: RejectMemberInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRejectMemberMutation(client: DB): RejectMemberResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId }: RejectMemberInput) =>
      rejectMember(client, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
  });

  const send = useCallback(
    (input: RejectMemberInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
