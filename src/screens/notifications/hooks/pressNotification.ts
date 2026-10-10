import { ORIGIN_NOTIFICATIONS } from "@/shared/consts/navigation.const";
import { BACK_BEARING_PREFIXES } from "@/screens/notifications/consts/notifications.const";

const ORIGIN = `from=${ORIGIN_NOTIFICATIONS}`;

function withOrigin(destination: string): string {
  const bearsBack = BACK_BEARING_PREFIXES.some((prefix) =>
    destination.startsWith(prefix),
  );

  if (!bearsBack) {
    return destination;
  }

  return destination.includes("?")
    ? `${destination}&${ORIGIN}`
    : `${destination}?${ORIGIN}`;
}

export type PressNotificationInput = {
  ids: string[];
  destination: string;
  navigate: (destination: string) => void;
  markRead: (ids: string[]) => Promise<void>;
};

export async function pressNotification({
  ids,
  destination,
  navigate,
  markRead,
}: PressNotificationInput): Promise<void> {
  navigate(withOrigin(destination));

  try {
    await markRead(ids);
  } catch {
    return;
  }
}
