import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { updateMyContact } from "@/entities/profile/dals/update-my-contact";
import { PROFILE_PRIVATE_KEY } from "@/features/profile/model/query-keys";

/**
 * 연락처 저장이다. 낙관적으로 먼저 칠하지 않고 응답을 기다린다 — 고치는 자리가 시트 안이라
 * 실패를 그 자리에 세워야 하고, 먼저 칠해 두면 시트가 닫힌 뒤에 값이 되돌아간다
 * (`docs/2-design/system/runtime.md`의 「낙관적 업데이트」).
 *
 * **보내는 중에 또 보내지 않는다.** 저장 버튼이 스피너를 물고 잠기지만 그것은 그림이고,
 * 두 번 눌리는 경로를 막는 것은 이 자리다 — 잠그는 일과 막는 일을 화면 둘이 나눠 가지면
 * 한쪽만 고쳐질 수 있다.
 */

export type UpdateContactInput = {
  profileId: string;
  phone: string;
};

export type UpdateContactResult = {
  mutate: (input: UpdateContactInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useUpdateContact(client: Db): UpdateContactResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId, phone }: UpdateContactInput) =>
      updateMyContact(client, profileId, phone),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROFILE_PRIVATE_KEY }),
  });

  const save = useCallback(
    (input: UpdateContactInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
