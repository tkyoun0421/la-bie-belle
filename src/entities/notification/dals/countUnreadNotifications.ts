import type { DB } from "@/shared/api/database";

/**
 * 안 읽은 알림이 몇 건인지다. 종 아이콘의 점이 이 수를 본다.
 *
 * **목록과 다른 질의다.** 목록은 50건씩 끊어 읽는데(`get-notifications.ts`) 그 창으로 세면
 * 쉰한 건째부터 안 보인다 — 헤아리는 것은 행을 안 받는 count 질의라야 창에 안 갇힌다.
 *
 * **수를 내지만 화면은 여부만 쓴다.** 점만 찍고 수를 안 적는 것은
 * `docs/2-design/design-system/components.md`의 「종 아이콘」이고, 이 손은 실수를 그대로
 * 낸다 — 대시보드의 「안 본 알림 n」이 같은 수를 쓴다.
 *
 * 조건이 `read_at`뿐인 것은 RLS가 이미 본인 행으로 좁혀서다.
 */

export async function countUnreadNotifications(client: DB): Promise<number> {
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}
