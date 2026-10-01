import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { splitSlot } from "@/features/schedule/api/splitSlot.api";

/**
 * 겸임 자리를 나눈다 — 겸임 카드 시트의 「자리 나누기」다. 배정된 사람은 받은 쪽에 그대로
 * 남는다(`docs/2-design/modules/schedule/design.md`의 「날과 자리」).
 */

export type SplitSlotInput = {
  slotId: string;
};

export type SplitSlotResult = {
  mutate: (input: SplitSlotInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSplitSlotMutation(client: DB): SplitSlotResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ slotId }: SplitSlotInput) => splitSlot(client, slotId),
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: SplitSlotInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
