import { kstDateOf } from "@/shared/utils/kstDate";
import { ADMIN_NOTICE } from "@/entities/notification/model/types";

/**
 * 알림 목록 화면이 그릴 것을 정하는 계산 셋이다. 정본은
 * `docs/2-design/modules/notification/screens/notifications.md`의 「화면 상태와 흐름」과
 * 「날짜 머리」다.
 *
 * **묶는 축이 한국 달력일이다.** 자정 직전과 직후는 20분 차이라도 다른 묶음이다 — 머리가
 * 「오늘」·「어제」로 읽히려면 경과 시간이 아니라 날 경계를 따라야 한다.
 *
 * **상태 일곱이 한 함수에서 갈린다.** 화면이 조건 일곱을 늘어놓으면 「읽는 중이면서 빈
 * 상태」 같은 자리가 생긴다. 여기서 하나로 좁혀 화면은 받은 이름 하나를 그리기만 한다.
 *
 * **안 읽은 관리자 공지를 여기서 고른다.** 그 종류만 「열면 읽음」이라 화면에 들어온 순간
 * 읽음을 찍는데(같은 문서의 「안 눌리는 줄」), 그 판정을 화면의 `useEffect` 안에서 하면
 * 계산이 UI로 샌다(ADR-001).
 */

export type NotificationDateGroup<Row> = {
  date: string;
  rows: Row[];
};

export function groupNotificationsByDate<Row extends { created_at: string }>(
  rows: readonly Row[],
): NotificationDateGroup<Row>[] {
  const groups: NotificationDateGroup<Row>[] = [];

  for (const row of rows) {
    const date = kstDateOf(row.created_at);
    const last = groups.at(-1);

    if (last !== undefined && last.date === date) {
      last.rows.push(row);
      continue;
    }

    groups.push({ date, rows: [row] });
  }

  return groups;
}

export type NotificationsListState =
  | "loading"
  | "error"
  | "empty"
  | "loadingMore"
  | "errorMore"
  | "end"
  | "normal";

export type NotificationsListInput = {
  rows: readonly unknown[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
};

export function resolveNotificationsListState(
  input: NotificationsListInput,
): NotificationsListState {
  if (input.isLoading) {
    return "loading";
  }

  if (input.isError) {
    return "error";
  }

  if (input.rows.length === 0) {
    return "empty";
  }

  if (input.isFetchingNextPage) {
    return "loadingMore";
  }

  if (input.isFetchNextPageError) {
    return "errorMore";
  }

  return input.hasNextPage ? "normal" : "end";
}

export function unreadAdminNoticeIds<
  Row extends { id: string; kind: string; read_at: string | null },
>(rows: readonly Row[]): string[] {
  return rows
    .filter((row) => row.kind === ADMIN_NOTICE && row.read_at === null)
    .map((row) => row.id);
}
