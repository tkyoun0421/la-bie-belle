import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { removeSlot } from "@/entities/schedule/dals/removeSlot";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/queryKeys";

/**
 * 자리를 버리는 손짓의 서버 쪽이다. 빈 자리와 사람 든 자리를 가르는 확인 시트는 화면의
 * 몫이라(`screens/schedule-admin/model/discardSlot.ts`) 이 훅은 안 본다 — 여기 닿았을
 * 때는 이미 지우기로 정해진 뒤다.
 */

export type RemoveSlotInput = {
  slotId: string;
};

export type RemoveSlotResult = {
  mutate: (input: RemoveSlotInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRemoveSlot(client: DB): RemoveSlotResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ slotId }: RemoveSlotInput) => removeSlot(client, slotId),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: RemoveSlotInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
