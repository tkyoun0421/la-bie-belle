import { ORIGIN_NOTIFICATIONS } from "@/shared/consts/navigation.const";
import { BACK_BEARING_PREFIXES } from "@/screens/notifications/consts/notifications.const";

const ORIGIN = `from=${ORIGIN_NOTIFICATIONS}`;

export function withOrigin(destination: string): string {
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
