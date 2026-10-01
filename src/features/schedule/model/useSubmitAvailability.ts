import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { submitAvailability } from "@/entities/schedule/dals/submitAvailability";
import { AVAILABILITY_KEY } from "@/features/schedule/model/queryKeys";

/**
 * 그 달 근무 신청을 보낸다. 고른 날짜를 통째로 보내고 서버가 그 달 행을 덮어쓴다
 * (`docs/2-design/modules/schedule/design.md`의 「근무 신청 내기」).
 *
 * **빈 배열도 그대로 간다.** 이미 낸 신청을 전부 무르는 길이 그것뿐이라 화면도 여기도 0개를
 * 안 막는다.
 *
 * 보내는 중에 다시 눌러도 한 번만 간다 — 덮어쓰기라 두 번째가 첫 번째를 이기는데, 어느 쪽이
 * 나중에 닿을지가 정해져 있지 않다.
 */

export type SubmitAvailabilityInput = {
  month: string;
  dates: string[];
};

export type SubmitAvailabilityResult = {
  mutate: (input: SubmitAvailabilityInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSubmitAvailability(client: DB): SubmitAvailabilityResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ month, dates }: SubmitAvailabilityInput) =>
      submitAvailability(client, month, dates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY }),
  });

  const send = useCallback(
    (input: SubmitAvailabilityInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
