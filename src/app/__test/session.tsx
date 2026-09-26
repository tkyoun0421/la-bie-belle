import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { armProfileReadFailure, isDevDoorOpen } from "@/shared/lib/dev-door";
import { supabase } from "@/shared/lib/supabase";
import { decideEntry } from "@/features/auth/decide-entry";

/**
 * e2e가 세션을 심는 문이다. 화면이 아니라 문 하나라 그리는 것이 없다.
 *
 * Maestro는 앱 내부를 안 봐서 코드로 세션을 넣을 수 없다. 그래서 앱이 문을 하나 낸다 —
 * `labiebelle://__test/session?access_token=…&refresh_token=…`을 열면 세션을 앉히고 게이트
 * 판정을 다시 돌려 그 사람이 설 화면으로 보낸다. 토큰과 DB 상태는 시드 서버
 * (`scripts/e2e-seed-server.mts`)가 만든다. 정본은 `docs/4-test/execution.md`의
 * 「`pnpm e2e`」 절이다.
 *
 * **판정을 여기서 다시 돈다.** 껍데기(`_layout.tsx`)의 판정은 앱이 뜰 때 한 번뿐이고 그때는
 * 세션이 없었다. 그냥 `/`로 보내면 승인 안 난 사람이 대시보드에 선다.
 *
 * `simulate=read_failure`는 다음 프로필 읽기 한 번을 실패시킨다. e2e에는 기기의 네트워크를
 * 끊을 수단이 없어서 「읽기가 실패하면 앱이 어떻게 보이는가」만 확인하는 자리다 —
 * `tests/e2e/retry.yaml` 머리말이 그 한계를 적었다.
 *
 * `_catalog`와 같은 꼴로 개발 빌드가 아니면 `/`로 돌려보낸다. Expo Router는 파일이 있으면
 * 경로를 만들어서 프로덕션 번들에서 라우트를 뺄 길이 없다.
 */

const READ_FAILURE = "read_failure";

type DoorParams = {
  access_token?: string;
  refresh_token?: string;
  simulate?: string;
};

export default function Screen() {
  const router = useRouter();
  const { access_token, refresh_token, simulate } =
    useLocalSearchParams<DoorParams>();
  const open = isDevDoorOpen(__DEV__);

  useEffect(() => {
    if (!open || !access_token || !refresh_token) {
      return;
    }

    let abandoned = false;

    void (async () => {
      await supabase.auth.setSession({ access_token, refresh_token });

      if (simulate === READ_FAILURE) {
        armProfileReadFailure();
      }

      const destination = await decideEntry({ client: supabase });

      if (!abandoned) {
        router.replace(destination);
      }
    })();

    return () => {
      abandoned = true;
    };
  }, [open, access_token, refresh_token, simulate, router]);

  if (!open) {
    return <Redirect href="/" />;
  }

  return null;
}
