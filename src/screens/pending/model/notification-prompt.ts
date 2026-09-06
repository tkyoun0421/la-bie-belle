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

async function askBrowser(): Promise<NotificationPromptOutcome> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    return (await window.Notification.requestPermission()) === "granted"
      ? "granted"
      : "denied";
  } catch {
    return "unsupported";
  }
}

export async function askForNotificationPermission(
  current: NotificationPromptView,
): Promise<NotificationPromptView> {
  return transitionNotificationPromptView(current, await askBrowser());
}
