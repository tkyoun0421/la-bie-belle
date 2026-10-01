import {
  PUSH_DENIED_SUBLINE,
  PUSH_DENIED_TITLE,
} from "@/entities/notification/model/profileNotificationRow.policy";
import type { NotificationPromptView } from "@/screens/pending/model/notificationPrompt.policy";

/**
 * 승인 대기 화면 알림 영역의 문안이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「승인 대기 문안」이고 모습 셋은 같은
 * 문서의 「알림 영역의 세 모습」이다. 어느 모습인지는
 * [`notification-prompt`](notificationPrompt.ts)가 정하고 여기는 문장만 고른다.
 *
 * **켠 사람에게만 약속한다.** 아직 안 켠 모습은 묻기만 하고, 켠 뒤에야 「알려드릴게요」라고
 * 적는다 — 안 켠 사람에게 앱이 알려줄 길이 없다.
 *
 * **버튼은 첫 모습에만 있다.** 거부한 뒤에 버튼을 그대로 두면 눌러도 아무 일이 안 일어난다
 * ([NTF-027](../../../../docs/2-design/modules/notification/README.md#ntf-027)).
 *
 * **거부한 뒤 문장을 여기서 짓지 않는다.** 「나」 화면의 알림 안내와 같은 문장이라
 * [`profile-notification-row`](../../../features/notification/model/profileNotificationRow.ts)가
 * 들고 있는 것을 가져다 쓴다 — 두 벌로 두면 한쪽만 고쳐진다.
 */

export const NOTIFICATION_PROMPT_BUTTON = "알림 켜기";

export type NotificationPromptCopy = {
  title: string;
  subline: string;
  hasButton: boolean;
};

const COPY: Record<NotificationPromptView, NotificationPromptCopy> = {
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

export function getNotificationPromptCopy(
  view: NotificationPromptView,
): NotificationPromptCopy {
  return COPY[view];
}
