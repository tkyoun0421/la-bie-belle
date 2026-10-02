import {
  PUSH_DENIED_SUBLINE,
  PUSH_DENIED_TITLE,
} from "@/entities/notification/consts/notification.const";
import type { PushPermission } from "@/entities/notification/model/reachState.policy";
import type {
  NotificationPromptCopy,
  NotificationPromptOutcome,
  NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";

/**
 * 승인 대기 화면 알림 영역의 문안과 정해진 값이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「승인 대기 문안」이고 모습 셋은 같은
 * 문서의 「알림 영역의 세 모습」이다. 어느 모습인지를 정하는 것은
 * [`model`](../model/notificationPrompt.policy.ts)이고 여기는 값만 든다.
 *
 * **켠 사람에게만 약속한다.** 아직 안 켠 모습은 묻기만 하고, 켠 뒤에야 「알려드릴게요」라고
 * 적는다 — 안 켠 사람에게 앱이 알려줄 길이 없다.
 *
 * **버튼은 첫 모습에만 있다.** 거부한 뒤에 버튼을 그대로 두면 눌러도 아무 일이 안 일어난다
 * ([NTF-027](../../../../docs/2-design/modules/notification/README.md#ntf-027)).
 *
 * **거부한 뒤 문장을 여기서 짓지 않는다.** 「나」 화면의 알림 안내와 같은 문장이라
 * `entities/notification`이 들고 있는 것을 가져다 쓴다 — 두 벌로 두면 한쪽만 고쳐진다.
 */

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

export const NOTIFICATION_PROMPT_BUTTON = "알림 켜기";

export const NOTIFICATION_PROMPT_COPY: Record<
  NotificationPromptView,
  NotificationPromptCopy
> = {
  idle: {
    title: "승인되면 알려드릴까요?",
    subline: "알림을 켜두면 앱을 안 열어도 알 수 있어요",
    hasButton: true,
  },
  enabled: {
    title: "승인되면 알려드릴게요",
    subline: "알림은 설정에서 언제든 끌 수 있어요",
    hasButton: false,
  },
  denied: {
    title: PUSH_DENIED_TITLE,
    subline: PUSH_DENIED_SUBLINE,
    hasButton: false,
  },
};
