import type { PushPermission } from "@/features/notification/model/reach-state";

/**
 * 승인 대기 화면 알림 영역의 모습 셋이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「알림 영역의 세 모습」이다.
 *
 * **저절로 안 띄운다.** 들어왔을 때는 늘 「아직 안 켬」이고, 사람이 「알림 켜기」를 눌러
 * 기기가 답을 준 뒤에만 모습이 바뀐다.
 *
 * **넷째 모습이 없다.** 거부와, 기기가 물음 자체를 못 띄우는 경우가 같은 「거부한 뒤」로
 * 간다 — 둘 다 켜는 길이 기기 설정뿐이라 화면이 할 말이 같다. 기기 종류를 판별해 문안을
 * 가르지도 않는다(같은 절).
 */

export type NotificationPromptView = "idle" | "enabled" | "denied";

export type NotificationPromptOutcome = "granted" | "denied" | "unsupported";

/**
 * 물어본 뒤에도 「안 물어본 상태」로 남았다는 것은 기기가 물음 자체를 못 띄웠다는 뜻이다 —
 * 사람이 거부한 것과 다르지만 켜는 길이 기기 설정뿐인 것은 같아서 같은 모습으로 간다.
 */
export const PROMPT_OUTCOME_OF: Record<
  PushPermission,
  NotificationPromptOutcome
> = {
  granted: "granted",
  denied: "denied",
  undetermined: "unsupported",
};

export const INITIAL_NOTIFICATION_PROMPT_VIEW: NotificationPromptView = "idle";

export function transitionNotificationPromptView(
  current: NotificationPromptView,
  outcome: NotificationPromptOutcome,
): NotificationPromptView {
  return outcome === "granted" ? "enabled" : "denied";
}
