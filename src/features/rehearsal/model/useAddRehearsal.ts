import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { staleTogether } from "@/shared/api/queryKeys";
import {
  addRehearsal,
  type AddRehearsalInput,
} from "@/entities/rehearsal/dals/addRehearsal";

/**
 * 리허설 넣기다. 성공하면 `['rehearsal']`과 `['payroll']`이 낡는다 —
 * **`['schedule']`은 안 건드린다**(`docs/2-design/system/runtime.md`의 「무효화 표」).
 *
 * `DomainError`를 그대로 낸다. 시트가 `wrong_kind`와 `overlaps`를 갈라 다르게 말해야 해서
 * (`docs/2-design/modules/schedule/screens/rehearsal.md`의 「넣는 중」) 여기서 문구로
 * 바꾸지 않는다.
 */

export type AddRehearsalResult = {
  mutate: (input: AddRehearsalInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useAddRehearsal(client: DB): AddRehearsalResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: AddRehearsalInput) => addRehearsal(client, input),
    onSuccess: () => {
      for (const queryKey of staleTogether.rehearsalWrite) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const send = useCallback(
    (input: AddRehearsalInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
