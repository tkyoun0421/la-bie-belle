export type NotificationPromptView = "idle" | "enabled" | "denied";

export type NotificationPromptOutcome = "granted" | "denied" | "unsupported";

export type NotificationPromptCopy = {
  title: string;
  subline: string;
  hasButton: boolean;
};

export function transitionNotificationPromptView(
  current: NotificationPromptView,
  outcome: NotificationPromptOutcome,
): NotificationPromptView {
  return outcome === "granted" ? "enabled" : "denied";
}
