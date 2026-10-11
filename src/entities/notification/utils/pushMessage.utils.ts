import { PUSH_MESSAGES_PER_REQUEST } from "@/entities/notification/consts/notification.const";
import { toNotificationDestination } from "@/entities/notification/model/destination.policy";
import { toNotificationTitle } from "@/entities/notification/utils/title.utils";

export type ClaimedPushNotification = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  tokens: string[];
};

export type PushMessage = {
  to: string;
  title: string;
  body: string | null;
  data: { kind: string; destination: string };
  notificationId: string;
};

export function buildPushMessages(
  rows: readonly ClaimedPushNotification[],
): PushMessage[] {
  return rows.flatMap((row) => {
    const title = toNotificationTitle(row);
    const destination = toNotificationDestination(row);

    if (title === null || destination === null) {
      return [];
    }

    return row.tokens.map((token) => ({
      to: token,
      title: title.title,
      body: title.sub,
      data: { kind: row.kind, destination },
      notificationId: row.id,
    }));
  });
}

export function chunkPushMessages(
  messages: readonly PushMessage[],
): PushMessage[][] {
  return Array.from(
    { length: Math.ceil(messages.length / PUSH_MESSAGES_PER_REQUEST) },
    (_unused, at) =>
      messages.slice(
        at * PUSH_MESSAGES_PER_REQUEST,
        (at + 1) * PUSH_MESSAGES_PER_REQUEST,
      ),
  );
}
