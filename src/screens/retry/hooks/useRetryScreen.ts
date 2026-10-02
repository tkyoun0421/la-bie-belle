import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { decideEntry } from "@/features/auth/lib/decideEntry.lib";
import type { EntryDecision } from "@/features/auth/model/auth.type";

/**
 * 읽기 실패 화면의 controller다.
 *
 * **이 화면이 제 업무 상태를 드는 자리는 「다시 시도」 하나뿐이다.** 세션의 사람과
 * 로그아웃은 service 둘(`useSessionUserQuery`·`useSignOutMutation`)이 가지고 `.tsx`가
 * 직접 부른다 — 화면 다섯이 같이 쓰는 것을 화면마다 controller로 감싸면 사본이 다섯 벌
 * 그대로다.
 *
 * **재시도를 Mutation으로 든다.** 돌고 있나(`isPending`)와 두 번 누름 막기를 손으로
 * 적을 이유가 없고, 판정이 던져도 `.tsx`가 멈추지 않는다 — `decideEntry`가 제 안에서
 * 거의 다 삼키지만 그 밖의 실패도 여기서 끝난다.
 *
 * **`/retry`가 나오면 아무 데도 안 보낸다.** 이 화면이 그대로 서는 것이 그 답이고, 몇
 * 번째 실패인지 세지도 문구를 바꾸지도 않는다
 * (`docs/2-design/modules/account/screens/login.md`의 「읽기 실패 짜임」).
 *
 * `router`를 인자로 받는 것은 `expo-router`의 훅이 `.tsx`에서 더 읽기 쉽고, 이 자리가
 * 짝 테스트에서 가짜 router로 돌아가야 하기 때문이다.
 */

type RetryRouter = { replace: (href: EntryDecision) => void };

export type RetryScreenController = {
  retry: () => void;
  retrying: boolean;
};

export function useRetryScreen(
  client: DB,
  router: RetryRouter,
): RetryScreenController {
  const { mutate, isPending } = useMutation({
    mutationFn: () => decideEntry({ client }),
    onSuccess: (destination) => {
      if (destination !== "/retry") {
        router.replace(destination);
      }
    },
  });

  const retry = useCallback(() => {
    if (!isPending) {
      mutate();
    }
  }, [isPending, mutate]);

  return { retry, retrying: isPending };
}
