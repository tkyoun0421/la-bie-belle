import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { openDay } from "@/entities/schedule/dals/open-day";
import { SCHEDULE_WRITE_KEYS } from "@/features/schedule/model/query-keys";

/**
 * 날 하나를 연다. 함수가 날 하나를 받는 모양이라
 * (`docs/2-design/modules/schedule/design.md`의 「날 열기·닫기」) 여러 날을 한 번에 여는
 * 순서와 부분 실패 처리는 이 훅이 아니라 화면의 몫이다.
 */

export type OpenDayInput = {
  workDate: string;
};

export type OpenDayResult = {
  mutate: (input: OpenDayInput) => void;
  mutateAsync: (input: OpenDayInput) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useOpenDay(client: Db): OpenDayResult {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isSuccess, isError, error, reset } =
    useMutation({
      mutationFn: ({ workDate }: OpenDayInput) => openDay(client, workDate),
      onSuccess: () => {
        for (const queryKey of SCHEDULE_WRITE_KEYS) {
          void queryClient.invalidateQueries({ queryKey });
        }
      },
    });

  const send = useCallback(
    (input: OpenDayInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return {
    mutate: send,
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  };
}
