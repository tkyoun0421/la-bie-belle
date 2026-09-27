import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import {
  setHallDefaults,
  type HallDefaultsInput,
} from "@/entities/schedule/dals/set-hall-defaults";
import { HALL_KEY } from "@/features/schedule/model/query-keys";

/**
 * 홀의 자리·근무 시간 기본값을 바꾼다.
 *
 * **`['hall']`만 낡는다.** 이미 연 날의 근무 시간은 열던 순간 깔린 값이라 안 바뀌므로
 * `['schedule']`을 건드리면 바뀐 것이 없는 근무표를 다시 읽게 된다
 * (`docs/2-design/modules/schedule/design.md`의 「홀 기본값」).
 */

export type SetHallDefaultsResult = {
  mutate: (input: HallDefaultsInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetHallDefaults(client: Db): SetHallDefaultsResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: HallDefaultsInput) => setHallDefaults(client, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HALL_KEY }),
  });

  const send = useCallback(
    (input: HallDefaultsInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
