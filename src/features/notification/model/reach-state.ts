/**
 * 알림이 그 사람에게 닿는지를 한 값으로 내는 자리다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「알림을 받나」다.
 *
 * **의사와 기기는 다른 값이다.** 받겠다는 의사는 `profiles.notifications_enabled`고 기기가
 * 실제로 닿는지는 `push_tokens` 행의 유무다. 둘을 곱해 셋이 나고, 여기에 내 기기의 권한이
 * 얹혀 넷이 된다 — 끔 / 켰는데 기기 없음 / 켰고 기기 있음 / 권한 거부다.
 *
 * **권한 거부가 의사와 기기보다 앞선다.** 거부된 기기에는 스위치를 세워도 눌러서 할 수 있는
 * 일이 없어([NTF-027](../../../../docs/2-design/modules/notification/README.md#ntf-027))
 * 화면이 그 자리에 안내를 세운다. 무엇을 세울지가 여기서 갈린다.
 *
 * **다 못 읽은 동안은 넷 중 무엇도 아니다.** 읽기 전에 꺼진 모양으로 그리면 켜 둔 사람에게
 * 「내가 언제 껐지」를 묻게 한다(spec 상태 격자의 「로딩」).
 */

/** 기기가 내는 권한 상태 셋이다. 안 물어본 상태와 거부는 화면에서 갈린다. */
export type PushPermission = "undetermined" | "granted" | "denied";

export type ReachState =
  "loading" | "denied" | "off" | "no-device" | "reachable";

export type ReachInput = {
  notificationsEnabled: boolean | null;
  hasDevice: boolean | null;
  permission: PushPermission | null;
};

/**
 * 관리자 화면이 남의 갈래를 볼 때 쓰는 권한 값이다. 기기 권한은 그 사람의 기기에만 있는
 * 값이라 `push_reachable`에도 안 오고 올 길도 없다 — 거부 갈래는 그 사람의 「나」 화면에서만
 * 선다. 남을 볼 때 판정에 드는 축은 의사와 기기 둘뿐이라는 뜻이다.
 */
export const PERMISSION_OF_OTHERS: PushPermission = "granted";

/** 닿는 갈래다. 화면이 「알림이 간다」를 물을 때 견주는 값이라 이름을 밖에 둔다. */
export const REACHABLE: ReachState = "reachable";

export function getReachState({
  notificationsEnabled,
  hasDevice,
  permission,
}: ReachInput): ReachState {
  if (
    notificationsEnabled === null ||
    hasDevice === null ||
    permission === null
  ) {
    return "loading";
  }

  if (permission === "denied") {
    return "denied";
  }

  if (!notificationsEnabled) {
    return "off";
  }

  return hasDevice ? "reachable" : "no-device";
}
