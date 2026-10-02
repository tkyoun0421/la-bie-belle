import { ORIGIN_NOTIFICATIONS } from "@/shared/consts/navigation.const";
import { BACK_BEARING_PREFIXES } from "@/screens/notifications/consts/notifications.const";

/**
 * 알림 목록에서 줄을 눌렀을 때다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「읽음 찍기」와
 * `docs/2-design/spec/notification-list.md`의 AC-05다.
 *
 * **이동이 먼저다.** 읽음과 이동이 같은 순간인데 둘 중 하나는 앞에 서야 하고, 읽음을
 * 먼저 기다리면 네트워크가 느린 자리에서 누른 손이 멈춰 선다. 못 찍힌 읽음은 다음에 누르면
 * 찍히고 못 간 이동은 사람이 막힌다.
 *
 * **읽음 실패는 조용하다.** 이동이 먼저라 그 사람은 이미 다른 화면에 있다 — 앞 화면의
 * 되돌림을 보여줄 방법이 없어 토스트도 되돌림도 없고 다음 읽기가 맞춘다.
 *
 * **출처는 앱바 뒤로가 있는 화면에만 싣는다.** 그 화면의 목록은 `consts`가 든다.
 */

const ORIGIN = `from=${ORIGIN_NOTIFICATIONS}`;

function withOrigin(destination: string): string {
  const bearsBack = BACK_BEARING_PREFIXES.some((prefix) =>
    destination.startsWith(prefix),
  );

  if (!bearsBack) {
    return destination;
  }

  return destination.includes("?")
    ? `${destination}&${ORIGIN}`
    : `${destination}?${ORIGIN}`;
}

export type PressNotificationInput = {
  ids: string[];
  destination: string;
  navigate: (destination: string) => void;
  markRead: (ids: string[]) => Promise<void>;
};

export async function pressNotification({
  ids,
  destination,
  navigate,
  markRead,
}: PressNotificationInput): Promise<void> {
  navigate(withOrigin(destination));

  try {
    await markRead(ids);
  } catch {
    return;
  }
}
