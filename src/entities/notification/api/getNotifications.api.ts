import type { DB } from "@/shared/api/database";
import {
  NOTIFICATION_PAGE_SIZE,
  type NotificationRow,
} from "@/entities/notification/model/notification.type";

/**
 * 받은 알림 한 쪽이다. 최근부터 내려오고 `(profile_id, created_at desc)` 인덱스를 탄다.
 *
 * **조건이 쪽 번호뿐이다.** RLS가 이미 본인 행으로 좁혀
 * (`docs/2-design/modules/notification/design.md`의 「소유 데이터」) `profile_id`를 다시 안
 * 건다 — 관리자도 남의 알림을 읽는 길이 없다.
 *
 * **지난 것을 안 지운다**(NTF-026). 한 사람의 행이 해마다 쌓이므로 끊어 읽는 것이 그 방어고,
 * 쥐는 쪽 수의 한도는 부르는 쪽(`useNotificationsQuery`)이 건다.
 *
 * 쪽이 `NOTIFICATION_PAGE_SIZE`보다 적게 오면 그것이 마지막 쪽이다 — 세는 자리가 여기가
 * 아니라 부르는 쪽인 것은 다음 쪽을 물을지가 캐시의 판단이라서다.
 */

export const NOTIFICATION_COLUMNS =
  "id, profile_id, kind, payload, subject_id, created_at, read_at, claimed_at, push_attempts, pushed_at";

export async function getNotifications(
  client: DB,
  page: number,
): Promise<NotificationRow[]> {
  const first = page * NOTIFICATION_PAGE_SIZE;
  const { data, error } = await client
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .range(first, first + NOTIFICATION_PAGE_SIZE - 1)
    .returns<NotificationRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
