import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  submitProfile,
  type SubmitProfileInput,
} from "@/features/profileEdit/api/submitProfile.api";

/**
 * 가입 프로필 넷을 보낸다. 정본은
 * `docs/2-design/modules/account/design.md`의 「프로필 제출·연락처·사진」이다.
 *
 * **보내고 나면 내 프로필이 낡는다.** 보낸 시각과 이름과 개인정보가 한 번에 차는데, 그것을
 * 안 낡게 하면 같은 사람이 「나」로 갔을 때 보내기 전 값을 본다.
 *
 * **보내는 동안은 다시 안 보낸다.** 두 번 누르면 같은 프로필이 두 번 간다.
 */

export type SubmitProfileResult = {
  mutate: (input: SubmitProfileInput) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSubmitProfileMutation(client: DB): SubmitProfileResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: SubmitProfileInput) => submitProfile(client, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
  });

  const send = useCallback(
    (input: SubmitProfileInput) => {
      if (!isPending) {
        mutate(input);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
