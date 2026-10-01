import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { forceChange } from "@/features/scheduleConfirm/api/forceChange.api";

/**
 * 확정 뒤 「사람 바꾸기」다. 옛 배정을 닫고 새 배정을 여는 한 트랜잭션이 함수 안에서
 * 끝나므로 훅이 두 번 부르지 않는다(`docs/2-design/modules/schedule/design.md`의 「배정과
 * 강제 변경」) — 새 사람이 검사에 걸리면 기존 배정이 그대로 남는다.
 */

export type ForceChangeInput = {
  assignmentId: string;
  profileId: string;
};

export type ForceChangeResult = {
  mutate: (input: ForceChangeInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useForceChangeMutation(client: DB): ForceChangeResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ assignmentId, profileId }: ForceChangeInput) =>
      forceChange(client, assignmentId, profileId),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: ForceChangeInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
