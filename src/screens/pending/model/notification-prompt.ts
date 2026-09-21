export type NotificationPromptView = "idle" | "enabled" | "unsupported";

export type NotificationPromptOutcome = "granted" | "denied" | "unsupported";

export const INITIAL_NOTIFICATION_PROMPT_VIEW: NotificationPromptView = "idle";

export function transitionNotificationPromptView(
  current: NotificationPromptView,
  outcome: NotificationPromptOutcome,
): NotificationPromptView {
  if (outcome === "granted") {
    return "enabled";
  }

  if (outcome === "unsupported") {
    return "unsupported";
  }

  return current;
}
