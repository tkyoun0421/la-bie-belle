import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { setRole } from "@/entities/profile/dals/set-role";
import { MEMBERS_KEY } from "@/features/members/model/query-keys";

/**
 * 관리자로 올리고 내린다. 남에게 닿는 판정이라 응답을 기다린다
 * (`docs/2-design/modules/account/design.md`의 「처리와 경쟁」).
 *
 * 마지막 관리자를 내리면 서버가 `last_admin`으로 거절한다. 화면이 그 버튼을 미리 잠그지만
 * 그것은 목록을 받은 시점의 판정이고, 벽은 누르는 시점에 서버가 다시 센다.
 */

export type SetRoleInput = {
  profileId: string;
  role: string;
};

export type SetRoleResult = {
  mutate: (input: SetRoleInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSetRole(client: Db): SetRoleResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId, role }: SetRoleInput) =>
      setRole(client, profileId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });

  const send = useCallback(
    (input: SetRoleInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
