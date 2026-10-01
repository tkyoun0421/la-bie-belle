import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import { DomainError } from "@/shared/model/error.type";
import { confirmSchedule } from "@/features/scheduleConfirm/api/confirmSchedule.api";

/**
 * 그 달 근무표를 확정한다. 되돌리는 문이 없다(SCH-014).
 *
 * **`already_confirmed`를 성공으로 본다.** 관리자 둘이 같은 달을 확정했거나 재시도가 두 번
 * 닿은 것인데 둘을 구별할 길이 없고 결과도 같다 — 근무표는 확정돼 있다
 * (`docs/2-design/spec/schedule-admin.md`의 상태 격자 「동시 변경」). 그래서 이 판정이
 * dal이 아니라 여기 있다. `too_early`처럼 화면이 잘못 켜진 것을 말하는 코드는 그대로
 * 실패로 낸다.
 */

export type ConfirmScheduleInput = {
  month: string;
};

export type ConfirmScheduleResult = {
  mutate: (input: ConfirmScheduleInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

function isAlreadyConfirmed(error: unknown): boolean {
  return error instanceof DomainError && error.code === "already_confirmed";
}

export function useConfirmScheduleMutation(client: DB): ConfirmScheduleResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: async ({ month }: ConfirmScheduleInput) => {
      try {
        await confirmSchedule(client, month);
      } catch (thrown) {
        if (!isAlreadyConfirmed(thrown)) {
          throw thrown;
        }
      }
    },
    onSuccess: () => {
      for (const queryKey of staleTogether.scheduleWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: ConfirmScheduleInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
