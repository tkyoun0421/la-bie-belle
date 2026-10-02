import { NOTIFICATION_PROMPT_COPY } from "@/screens/pending/consts/pending.const";
import type {
  NotificationPromptCopy,
  NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";

/**
 * 모습 하나에 선 문장을 고른다. 어느 모습인지는
 * [`model`](../model/notificationPrompt.policy.ts)이 정하고 문장은
 * [`consts`](../consts/pending.const.ts)가 들어, 여기가 하는 일은 고르는 것뿐이다.
 */
export function getNotificationPromptCopy(
  view: NotificationPromptView,
): NotificationPromptCopy {
  return NOTIFICATION_PROMPT_COPY[view];
}
