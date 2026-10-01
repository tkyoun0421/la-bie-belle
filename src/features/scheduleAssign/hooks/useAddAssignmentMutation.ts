import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import {
  addAssignment,
  type AddAssignmentInput,
} from "@/features/scheduleAssign/api/addAssignment.api";

/**
 * 배정 추가 — 정규와 교육이 이 훅 하나로 간다. 갈래는 화면이 이미 정해 보낸다(빈 자리를
 * 눌렀으면 정규, 「교육 붙이기」를 눌렀으면 교육) — 훅은 받은 인자를 그대로 넘기고 갈래와
 * 인자가 맞는지는 함수가 다시 본다(`docs/2-design/modules/schedule/design.md`의 「배정과
 * 강제 변경」).
 */

export type AddAssignmentResult = {
  mutate: (input: AddAssignmentInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useAddAssignmentMutation(client: DB): AddAssignmentResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: AddAssignmentInput) => addAssignment(client, input),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: AddAssignmentInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
