import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { setDisplayName } from "@/features/members/api/setDisplayName.api";

/**
 * 관리자가 직원 이름을 고친다. 응답을 기다린다 — 고치는 자리가 시트 안이라 실패를 그 자리에
 * 세워야 하고, 먼저 칠해 두면 시트가 닫힌 뒤에 값이 되돌아간다.
 *
 * **세 키를 무효화한다.** 이름은 프로필의 값 하나인데 근무표와 급여가 그 값을 읽어 사람을
 * 부르므로, 고친 순간 지난 근무표에 뜨는 이름까지 바뀐다
 * (`docs/2-design/modules/account/design.md`의 「캐시 갱신」).
 *
 * **보내는 중에 또 보내지 않는다.** 저장 버튼이 잠기는 것은 그림이고, 두 번 눌리는 경로를
 * 막는 것은 이 자리다.
 */

export type SetDisplayNameInput = {
  profileId: string;
  name: string;
};

export type SetDisplayNameResult = {
  mutate: (input: SetDisplayNameInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetDisplayNameMutation(client: DB): SetDisplayNameResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId, name }: SetDisplayNameInput) =>
      setDisplayName(client, profileId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.member.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all });
    },
  });

  const save = useCallback(
    (input: SetDisplayNameInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
