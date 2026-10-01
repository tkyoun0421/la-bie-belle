import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { mergeSlots } from "@/entities/schedule/dals/mergeSlots";

/**
 * 줄 머리를 다른 줄 머리에 겹쳐 겸임을 만든다. 자리 id가 아니라 포지션 이름 둘을 보내는
 * 것은 화면이 집는 것이 줄 머리라서다(`docs/2-design/modules/schedule/design.md`의 「날과
 * 자리」) — 빈 자리를 고르는 것은 함수의 몫이다.
 */

export type MergeSlotsInput = {
  dayId: string;
  from: string;
  to: string;
};

export type MergeSlotsResult = {
  mutate: (input: MergeSlotsInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useMergeSlots(client: DB): MergeSlotsResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ dayId, from, to }: MergeSlotsInput) =>
      mergeSlots(client, dayId, from, to),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: MergeSlotsInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
