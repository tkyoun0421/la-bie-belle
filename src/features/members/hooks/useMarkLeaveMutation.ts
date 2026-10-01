import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { markLeave } from "@/features/members/api/markLeave.api";

/**
 * 그만둔 사람을 퇴사로 옮긴다. 성공하면 그 줄이 재직자 목록에서 빠지고 퇴사 구획에 서는데,
 * 두 목록이 `['members']` 아래 같이 살아 무효화 한 번으로 둘 다 다시 읽힌다.
 *
 * 거절 둘은 화면이 갈라 받는다 — 앞 배정이 남았으면 `has_future_assignments`고 마지막
 * 관리자면 `last_admin`이다. 둘 다 Dialog가 이유를 말하는 자리라 시트를 안 닫는다.
 */

export type MarkLeaveInput = {
  profileId: string;
};

export type MarkLeaveResult = {
  mutate: (input: MarkLeaveInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useMarkLeaveMutation(client: DB): MarkLeaveResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId }: MarkLeaveInput) => markLeave(client, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
  });

  const send = useCallback(
    (input: MarkLeaveInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
