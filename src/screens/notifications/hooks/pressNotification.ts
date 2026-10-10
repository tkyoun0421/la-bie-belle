import { withOrigin } from "@/screens/notifications/model/withOrigin.policy";

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
