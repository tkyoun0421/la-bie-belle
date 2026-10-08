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
  const messages: PushMessage[] = [];

  for (const row of rows) {
    const title = toNotificationTitle(row);
    const destination = toNotificationDestination(row);

    if (title === null || destination === null) {
      continue;
    }

    for (const token of row.tokens) {
      messages.push({
        to: token,
        title: title.title,
        body: title.sub,
        data: { kind: row.kind, destination },
        notificationId: row.id,
      });
    }
  }

  return messages;
}

export function chunkPushMessages(
  messages: readonly PushMessage[],
): PushMessage[][] {
  const chunks: PushMessage[][] = [];

  for (
    let start = 0;
    start < messages.length;
    start += PUSH_MESSAGES_PER_REQUEST
  ) {
    chunks.push(messages.slice(start, start + PUSH_MESSAGES_PER_REQUEST));
  }

  return chunks;
}
