import { useEffect, useRef } from "react";
import type { AppStateStatus } from "react-native";
import type { DB } from "@/shared/api/database";
import { isForegroundEntry } from "@/entities/notification/model/appEntry";
import { savePushToken } from "@/features/pushSwitch/api/savePushToken.api";

/**
 * 매 진입에 이 기기의 주소를 보낸다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「기기 주소」고 완료 조건은
 * `docs/2-design/spec/notification-settings.md`의 AC-04다.
 *
 * **진입이 둘이다.** 앱이 뜰 때 한 번과 포그라운드로 돌아올 때마다다. 무엇이 진입인지는
 * [`app-entry`](appEntry.ts)가 정하고 구독은 여기가 든다.
 *
 * **주소가 바뀌는 것도 같은 자리에서 받는다.** 앱이 떠 있는 동안 사람이 권한을 켜면 그때
 * 주소가 처음 서는데, 그 걸음이 앱을 다시 띄우지 않아 진입으로는 안 잡힌다.
 *
 * **실패를 삼킨다.** 저장이 실패해도 의사는 참인 채로 남아 「켰는데 기기가 없음」 갈래에
 * 서고 다음 진입에 다시 보낸다(spec 상태 격자의 「실패」). 여기서 던지면 화면이 뜨는 것을
 * 통신이 막는다.
 *
 * **같은 주소를 다시 보내도 행이 안 는다.** 겹침과 사람 사이를 옮기는 일과 끈 사람을 막는
 * 일은 전부 `save_push_token` 안에 있다 — 이 훅은 부르기만 한다(AC-05).
 *
 * `AppState`를 주입받는 것은 [`wire-auto-refresh`](../../../features/auth/hooks/wireAutoRefresh.ts)와
 * 같은 이유다 — 러너가 `react-native`를 실물로 묶어 대역이 안 선다.
 */

type AppStateSource = {
  addEventListener: (
    event: "change",
    listener: (state: AppStateStatus) => void,
  ) => { remove: () => void };
};

/** 마운트가 첫 진입이라 앞선 상태를 `active`로 둔다 — 그 한 번은 아래 효과가 이미 보낸다. */
const MOUNTED_AS_ACTIVE: AppStateStatus = "active";

export function useSavePushTokenMutation(
  client: DB,
  token: string | null,
  appState: AppStateSource,
): void {
  const latest = useRef(token);

  useEffect(() => {
    latest.current = token;

    if (token === null) {
      return;
    }

    void savePushToken(client, token).catch(() => {});
  }, [client, token]);

  useEffect(() => {
    let previous: AppStateStatus = MOUNTED_AS_ACTIVE;

    const subscription = appState.addEventListener("change", (next) => {
      const entered = isForegroundEntry(previous, next);
      previous = next;

      const current = latest.current;

      if (!entered || current === null) {
        return;
      }

      void savePushToken(client, current).catch(() => {});
    });

    return () => subscription.remove();
  }, [client, appState]);
}
