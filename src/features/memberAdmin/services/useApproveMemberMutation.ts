import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { approveMember } from "@/features/memberAdmin/api/approveMember.api";

/**
 * 가입 신청을 받는다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「승인」이다.
 *
 * **앱 전체의 첫 문이다** — 이것이 지나야 근무표도 급여도 열린다.
 *
 * **무효화가 `['members']` 하나다.** 네 목록(재직·퇴사·가입 대기·차단)이 그 접두사 아래
 * 같이 살아 판정 하나가 둘씩 움직인다(`account/design.md`의 「캐시 갱신」).
 *
 * 늦게 누른 쪽은 `already_decided`를 받는다 — 그 말을 하는 것은 화면이다.
 */

export type ApproveMemberInput = {
  profileId: string;
};

export type ApproveMemberResult = {
  mutate: (input: ApproveMemberInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useApproveMemberMutation(client: DB): ApproveMemberResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId }: ApproveMemberInput) =>
      approveMember(client, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
  });

  const send = useCallback(
    (input: ApproveMemberInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
