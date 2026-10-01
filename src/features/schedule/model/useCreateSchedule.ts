import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { createSchedule } from "@/entities/schedule/dals/createSchedule";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/queryKeys";

/**
 * 그 달 근무표를 만든다. 마감일을 같이 정하는 한 동작이라 입력도 한 묶음이다
 * (`docs/2-design/modules/schedule/design.md`의 「근무표 만들기와 마감일」).
 *
 * 보내는 중에 다시 눌러도 한 번만 간다 — 두 번째는 `already_exists`로 돌아와 방금 만든 것이
 * 실패로 보인다.
 */

export type CreateScheduleInput = {
  month: string;
  deadline: string;
};

export type CreateScheduleResult = {
  mutate: (input: CreateScheduleInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useCreateSchedule(client: DB): CreateScheduleResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ month, deadline }: CreateScheduleInput) =>
      createSchedule(client, month, deadline),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: CreateScheduleInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
