import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { addSlot } from "@/features/schedule/api/addSlot.api";

/**
 * 잠금이 풀린 포지션의 「자리 추가」다. 자리가 생기고 없어지는 일이 급여와 요청의 입력이라
 * 구조 변경 넷이 같은 셋을 낡게 한다(`docs/2-design/modules/schedule/design.md`의 「자리
 * 늘리기·줄이기·겸임」).
 */

export type AddSlotInput = {
  dayId: string;
  position: string;
};

export type AddSlotResult = {
  mutate: (input: AddSlotInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useAddSlotMutation(client: DB): AddSlotResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ dayId, position }: AddSlotInput) =>
      addSlot(client, dayId, position),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: AddSlotInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
