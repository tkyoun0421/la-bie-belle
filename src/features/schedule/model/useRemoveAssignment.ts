import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { removeAssignment } from "@/entities/schedule/dals/remove-assignment";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/query-keys";

/**
 * 「자리 비우기」와 강제 변경의 「사람 빼기」다. 확정 전이면 행이 지워지고 확정 뒤면
 * `ended_at`이 찍히는 갈림은 함수 안에서 나므로 훅이 확정 여부를 안 본다
 * (`docs/2-design/modules/schedule/design.md`의 「배정」).
 */

export type RemoveAssignmentInput = {
  assignmentId: string;
};

export type RemoveAssignmentResult = {
  mutate: (input: RemoveAssignmentInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRemoveAssignment(client: Db): RemoveAssignmentResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ assignmentId }: RemoveAssignmentInput) =>
      removeAssignment(client, assignmentId),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: RemoveAssignmentInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
