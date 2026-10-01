import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { setNotificationsEnabled } from "@/features/notification/api/setNotificationsEnabled.api";

/**
 * 알림 스위치 하나를 켜고 끈다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「알림」이고 순서는
 * `docs/2-design/spec/notification-settings.md`의 AC-02다.
 *
 * **켜기와 끄기의 순서가 반대다.** 켤 때는 의사를 먼저 참으로 바꾸고 나서 기기에 권한을
 * 묻는다 — 거부로 끝나도 의사는 참인 채로 남아 「켰는데 기기가 없음」 갈래에 선다. 기기
 * 설정에서 권한을 켜고 돌아오면 다음 진입에 주소가 저장된다. 순서를 뒤집어 권한부터 물으면
 * 거부한 사람의 의사가 안 남아 그 길이 막힌다.
 *
 * **끄기는 함수 하나뿐이다.** `set_notifications_enabled(false)`가 의사를 거짓으로 바꾸면서
 * 그 사람의 주소도 같이 지운다 — 앱이 두 번 부를 일이 없다. 권한도 안 묻는다.
 *
 * **스위치를 먼저 칠하고 실패하면 되돌린다.** 누르는 자리가 목록 줄이라 응답을 기다리면
 * 스위치가 손가락을 따라오지 않는다(`docs/2-design/system/runtime.md`의 「낙관적 업데이트」).
 * 되돌리는 것은 들고 있던 값을 버려 서버에서 온 값으로 돌아가는 것이다.
 *
 * **무효화 키가 `['members']`다.** 관리자 직원 목록의 갈래가 이 값으로 갈린다
 * (`docs/2-design/modules/notification/design.md`의 「알림을 받나」).
 *
 * 권한을 묻는 일은 주입받는다 — 기기에 붙는 일이라 이 훅이 들면 이 자리가 기기 없이는
 * 안 돈다. 끄기 전에 묻는 Dialog는 화면이 든다.
 */

export type NotificationSwitch = {
  enabled: boolean;
  isPending: boolean;
  turnOn: () => void;
  turnOff: () => void;
};

export function useNotificationSwitchMutation(
  client: DB,
  currentEnabled: boolean,
  requestPermission: () => Promise<boolean>,
): NotificationSwitch {
  const queryClient = useQueryClient();
  const [wanted, setWanted] = useState<boolean | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (on: boolean) => {
      await setNotificationsEnabled(client, on);

      if (on) {
        await requestPermission();
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.member.all }),
    onError: () => setWanted(null),
  });

  const flip = useCallback(
    (on: boolean) => {
      if (isPending) {
        return;
      }

      setWanted(on);
      mutate(on);
    },
    [isPending, mutate],
  );

  const turnOn = useCallback(() => flip(true), [flip]);
  const turnOff = useCallback(() => flip(false), [flip]);

  return { enabled: wanted ?? currentEnabled, isPending, turnOn, turnOff };
}
