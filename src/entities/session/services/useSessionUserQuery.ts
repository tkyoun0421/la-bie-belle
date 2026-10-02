import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";
import type { SessionUser } from "@/entities/session/model/session.type";
import { googlePhotoOf } from "@/entities/session/utils/googlePhotoOf.utils";

/**
 * 「지금 누가 들어와 있나」를 읽는 자리 하나다.
 *
 * **열두 자리가 같은 답을 각자 묻고 있었다.** 화면 아홉과 라우트 셋이 저마다 `useEffect`
 * 안에서 `getCurrentUser(supabase)`를 부르고 `useState`에 받았고, 받는 꼴도 셋으로
 * 갈렸다 — `id`만 쓰는 넷, 이메일과 사진을 쓰는 넷, 둘 다 쓰는 하나다. 한 키에 앉히면
 * 앱이 그 답을 한 번만 묻고 꼴이 하나로 못 박인다.
 *
 * **사진 주소를 여기서 꺼낸다.** 화면이 `googlePhotoOf`를 부르면 그것이 `.tsx`에 남는
 * 로직이다(ADR-001). 꼴을 바꾸는 일까지가 service의 몫이다.
 *
 * **세션이 없으면 `null`이고 던지지 않는다.** 로그인 전에도 이 훅이 걸리는 화면이 있고,
 * 「아직 안 읽음」(`undefined`)과 「세션 없음」(`null`)이 갈려야 껍데기가 빈 화면을 한
 * 프레임 안 비춘다.
 */
export function useSessionUserQuery(client: DB): {
  data: SessionUser | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.session.user(),
    queryFn: async (): Promise<SessionUser | null> => {
      const user = await getCurrentUser(client);

      return user === null
        ? null
        : {
            id: user.id,
            email: user.email ?? "",
            googlePhotoUrl: googlePhotoOf(user.user_metadata),
          };
    },
  });

  return { data, isLoading };
}
