import type { ReachState } from "@/features/notification/model/reachState";

/**
 * 「나」 화면의 알림 자리에 스위치를 세울지 안내를 세울지를 정한다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「알림」이고 완료 조건은
 * `docs/2-design/spec/notification-settings.md`의 AC-02·AC-03이다.
 *
 * **거부가 갈래보다 앞선다.** 한 번 거부하면 앱이 다시 못 물어 스위치를 세워도 눌러서 할 수
 * 있는 일이 없다([NTF-027](../../../../docs/2-design/modules/notification/README.md#ntf-027)).
 * 보내는 중이어도 이 자리는 안내다 — 잠긴 스위치를 그리면 곧 눌릴 것처럼 읽힌다.
 *
 * **기기가 안 닿는 것은 근무자에게 안 말한다.** 켠 사람의 스위치는 기기 유무와 상관없이
 * 켜짐이다 — 스위치가 켜진 옆에 「안 닿아요」를 적으면 고칠 것이 없는 경고가 된다
 * (profile.md 「알림」).
 *
 * **읽는 동안은 잠긴다.** 다 읽기 전에 꺼진 모양으로 그리면 켜 둔 사람에게 「내가 언제
 * 껐지」를 묻게 한다(spec 상태 격자의 「로딩」).
 *
 * 거부 문장 둘을 이 자리가 들고 있는 것은 승인 대기 화면이 같은 문장을 쓰기 때문이다 —
 * 거기서 거부한 사람이 여기로 온다
 * ([NTF-028](../../../../docs/2-design/modules/notification/README.md#ntf-028)).
 */

export const PUSH_DENIED_TITLE = "알림이 꺼져 있어요";

export const PUSH_DENIED_SUBLINE = "기기 설정에서 알림을 켜면 받을 수 있어요";

/**
 * 안 쓰는 열쇠를 `undefined`로 박아 둔다 — 갈래를 안 좁히고도 읽을 수 있어야 두 자리가 같은
 * 문장을 쓰는지 밖에서 견줄 수 있고, 값이 실리는 조합은 여전히 둘뿐이다.
 */
export type ProfileNotificationRow =
  | {
      kind: "switch";
      state: "on" | "off" | "locked";
      title?: undefined;
      subline?: undefined;
    }
  | {
      kind: "notice";
      state?: undefined;
      title: string;
      subline: string;
    };

export function getProfileNotificationRow(
  reach: ReachState,
  isPending: boolean,
): ProfileNotificationRow {
  if (reach === "denied") {
    return {
      kind: "notice",
      title: PUSH_DENIED_TITLE,
      subline: PUSH_DENIED_SUBLINE,
    };
  }

  if (reach === "loading" || isPending) {
    return { kind: "switch", state: "locked" };
  }

  return { kind: "switch", state: reach === "off" ? "off" : "on" };
}
