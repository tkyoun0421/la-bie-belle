import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { blockMember } from "@/features/memberAdmin/api/blockMember.api";

/**
 * 가입 신청자를 차단한다. 정본은 같은 문서의 「차단」이다.
 *
 * **거절과 갈린다** — 차단당한 사람은 다시 보낼 길이 막힌다.
 *
 * **무효화가 `['members']` 하나다.** 네 목록(재직·퇴사·가입 대기·차단)이 그 접두사 아래
 * 같이 살아 판정 하나가 둘씩 움직인다(`account/design.md`의 「캐시 갱신」).
 *
 * 늦게 누른 쪽은 `already_decided`를 받는다 — 그 말을 하는 것은 화면이다.
 */

export type BlockMemberInput = {
  profileId: string;
};

export type BlockMemberResult = {
  mutate: (input: BlockMemberInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useBlockMemberMutation(client: DB): BlockMemberResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId }: BlockMemberInput) =>
      blockMember(client, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
  });

  const send = useCallback(
    (input: BlockMemberInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
