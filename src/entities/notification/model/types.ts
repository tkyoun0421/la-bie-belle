/**
 * 알림 한 행의 모양과 종류다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「kind와 payload」 표고, 그 표를 옮긴
 * 자리가 이 파일의 유니온이다.
 *
 * **DB가 `kind`를 안 막는다.** 열이 그냥 `text`라(같은 문서의 「알림 행」) 낳는 쪽과 읽는
 * 쪽이 어긋나도 데이터베이스는 통과시킨다. 막는 자리가 여기고, 문장·목적지 함수가
 * `Record<NotificationKind, …>` 표로 갈래를 들어 하나라도 빠지면 컴파일에서 걸린다.
 *
 * **스물셋을 다 든다.** 2차 다섯(교대 넷·관리자 공지)도 지금 들어 있다 — 나중에 종류만
 * 늘리면 그 표들이 조용히 통과한다. 문장과 목적지는 1차 열여덟만 내고 2차는 널이다.
 *
 * `payload`의 값이 `unknown`인 것은 열쇠마다 타입이 다르고(날짜 문자열·수·문자열 배열) 그
 * 짝이 `kind`에 달려 있어서다. 읽는 함수가 자기가 아는 열쇠만 꺼내 좁힌다.
 */

export const NOTIFICATION_KINDS = [
  "signup_approved",
  "requests_open",
  "deadline_changed",
  "schedule_confirmed",
  "assignment_added",
  "assignment_removed",
  "shift_reminder",
  "weekend_reminder",
  "before_shift",
  "work_requested",
  "work_request_accepted",
  "work_request_exhausted",
  "cancel_requested",
  "cancel_approved",
  "cancel_rejected",
  "excuse_approved",
  "excuse_rejected",
  "vacancy_nudge",
  "admin_notice",
  "swap_requested",
  "swap_accepted",
  "swap_approved",
  "swap_exhausted",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationPayload = Record<string, unknown>;

export type NotificationRow = {
  id: string;
  profile_id: string;
  kind: NotificationKind;
  payload: NotificationPayload;
  subject_id: string | null;
  created_at: string;
  read_at: string | null;
  claimed_at: string | null;
  push_attempts: number;
  pushed_at: string | null;
};

/**
 * 한 쪽에 담는 수다. 읽는 손(`dals/getNotifications.ts`의 `range()`)과 다음 쪽이 있는지를
 * 세는 손(`features/notification/model/useNotifications.ts`)이 같은 수를 봐야 해서, 둘 다
 * 아는 아래층에 둔다 — 쪽이 이 수보다 적게 오면 그것이 마지막 쪽이다.
 */
export const NOTIFICATION_PAGE_SIZE = 50;

/**
 * 쥐고 있는 쪽 수의 한도다. 지난 알림을 안 지우는 규칙이라(NTF-026) 한 사람의 목록이 해마다
 * 길어지는데, 이 수가 끝없이 내려도 메모리가 안 늘게 막는다 — 위로 되감으면 앞 쪽을 다시
 * 읽는다. 쪽 크기와 같은 자리에 두는 것은 둘이 같은 질의의 설정이라서다.
 */
export const NOTIFICATION_MAX_PAGES = 3;

/** 목록에서 유일하게 안 눌리는 종류다 — 갈 곳이 없어 여는 것으로 읽음이 찍힌다. */
export const ADMIN_NOTICE: NotificationKind = "admin_notice";
