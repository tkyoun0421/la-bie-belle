import { toNotificationDestination } from "@/entities/notification/model/destination";
import { toNotificationTitle } from "@/entities/notification/model/title";

/**
 * 잡힌 알림 행을 기기에 부칠 메시지로 바꾸는 자리다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「푸시 보내기」고, 부치는 Edge Function
 * `send-push`는 여기가 낸 배열을 그대로 HTTP에 싣는다 — 판단이 전부 여기 있어야 unit이 지킨다.
 *
 * **주소마다 메시지 하나다.** 한 사람이 폰 둘을 쓰면 같은 알림이 둘로 나간다(NTF-019).
 * 주소가 없는 사람의 행은 잡히기는 해도 메시지가 0건이라 아무것도 안 나간다(NTF-029).
 *
 * **`data`에 문안을 안 싣는다.** payload가 4KB를 넘으면 통째로 거절당하고, 어차피 문안은
 * 화면이 그린다 — 실을 것은 `kind`와 목적지 둘뿐이다.
 *
 * **문장이 없는 종류는 못 보낸 채 남는다.** 2차 다섯(교대 넷·관리자 공지)이 그 자리고,
 * `title.ts`와 `destination.ts`가 내는 널이 곧 「아직 보낼 수 없다」다.
 *
 * `node:` import를 안 쓴다 — 이 폴더는 `supabase/functions/_shared/`로 복사돼 Deno로 돈다.
 * 막는 것은 `house/no-node-import-in-edge-shared`다.
 */

/** 한 번에 한 요청에 묶는 한도다. 그보다 많으면 나눠 부친다(「푸시 보내기」). */
export const PUSH_MESSAGES_PER_REQUEST = 100;

/** `claim_notifications`가 돌려주는 행 하나. `tokens`가 그 사람의 기기 주소 전부다. */
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
