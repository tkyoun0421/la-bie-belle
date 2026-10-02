import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import {
  DEVICE_CLEANUP_NOT_WIRED_YET,
  signOut,
} from "@/features/auth/lib/signOut.lib";

/**
 * 로그아웃 한 번이다. 순서는 `lib/signOut.lib.ts`가 들고 여기는 그 손에 무엇을 꽂을지를
 * 가진다 — 세션을 끊는 것은 받은 클라이언트고, 캐시를 비우는 것은 트리에 앉은
 * `QueryClient`다.
 *
 * **화면 다섯이 이 꽂는 일을 글자까지 같이 적고 있었다**(pending·left·blocked·retry·
 * profile). 한 자리만 어긋나도 기기에 남의 자료가 남는 순서인데 다섯 벌이었다.
 *
 * **보낼 데는 안 든다.** 끝나고 어디로 가는지는 이동이고, `services/`는 `expo-router`를
 * 못 당긴다(AC-08의 「`expo-*`는 `lib`·`ui`·`hooks`에만」). 지금은 다섯 다 `/login`이지만
 * 그 선택은 화면이 쥔다.
 *
 * **보내는 동안은 다시 안 보낸다.** 두 번 누르면 끊긴 세션으로 또 끊으러 간다.
 */

export type SignOutResult = {
  signOut: (onDone: () => void) => void;
  isPending: boolean;
};

export function useSignOutMutation(client: DB): SignOutResult {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      signOut({
        ...DEVICE_CLEANUP_NOT_WIRED_YET,
        signOut: async () => {
          await client.auth.signOut();
        },
        clearQueryClient: () => queryClient.clear(),
      }),
  });

  const send = useCallback(
    (onDone: () => void) => {
      if (!isPending) {
        mutate(undefined, { onSuccess: onDone });
      }
    },
    [isPending, mutate],
  );

  return { signOut: send, isPending };
}
