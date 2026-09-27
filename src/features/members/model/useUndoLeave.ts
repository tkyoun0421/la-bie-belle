import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { undoLeave } from "@/entities/profile/dals/undo-leave";
import { MEMBERS_KEY } from "@/features/members/model/query-keys";

/**
 * 퇴사 처리를 무른다. 시한이 없어 언제 눌러도 되고, 성공하면 그 줄이 퇴사 구획에서 재직자
 * 목록으로 돌아온다.
 *
 * 퇴사가 아닌 대상이면 `already_decided`다 — 관리자 둘이 같은 사람을 열었을 때 늦게 누른
 * 쪽이 받는 코드다.
 */

export type UndoLeaveInput = {
  profileId: string;
};

export type UndoLeaveResult = {
  mutate: (input: UndoLeaveInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useUndoLeave(client: Db): UndoLeaveResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId }: UndoLeaveInput) => undoLeave(client, profileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });

  const send = useCallback(
    (input: UndoLeaveInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
