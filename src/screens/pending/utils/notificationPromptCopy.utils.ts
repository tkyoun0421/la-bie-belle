import { NOTIFICATION_PROMPT_COPY } from "@/screens/pending/consts/pending.const";
import type {
  NotificationPromptCopy,
  NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";

export function getNotificationPromptCopy(
  view: NotificationPromptView,
): NotificationPromptCopy {
  return NOTIFICATION_PROMPT_COPY[view];
}
