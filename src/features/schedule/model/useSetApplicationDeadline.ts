import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { setApplicationDeadline } from "@/entities/schedule/dals/set-application-deadline";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/query-keys";

/**
 * 스케줄 신청 마감일을 옮긴다. 모아보기의 「마감일 바꾸기」와 확정 잠김의 「마감일 당기기」가
 * 같은 훅을 쓴다 — 당길 일이 생기는 자리가 둘이라 문은 둘이고 조각은 하나다
 * (`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「근무 신청 모아보기 짜임」).
 */

export type SetApplicationDeadlineInput = {
  month: string;
  deadline: string;
};

export type SetApplicationDeadlineResult = {
  mutate: (input: SetApplicationDeadlineInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetApplicationDeadline(
  client: Db,
): SetApplicationDeadlineResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ month, deadline }: SetApplicationDeadlineInput) =>
      setApplicationDeadline(client, month, deadline),
    onSuccess: () => {
      for (const queryKey of SCHEDULE_WRITE_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: SetApplicationDeadlineInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
