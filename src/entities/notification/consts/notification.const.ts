import type {
  PushPermission,
  ReachState,
} from "@/entities/notification/model/reachState.policy";

/**
 * 알림의 정해진 값과 문안이다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「kind와 payload」·「알림을 받나」·「푸시
 * 보내기」와 `docs/2-design/system/runtime.md`의 「읽기 범위」다.
 *
 * `node:` import를 안 쓴다 — 이 폴더는 `supabase/functions/_shared/`로 복사돼 Deno로 돈다.
 */

/**
 * 알림 종류 스물셋이다. 열이 그냥 `text`라 낳는 쪽과 읽는 쪽이 어긋나도 DB는 통과시키고,
 * 막는 자리가 이 목록에서 나는 유니온이다.
 *
 * **2차 다섯(교대 넷·관리자 공지)도 지금 들어 있다** — 나중에 종류만 늘리면
 * `Record<NotificationKind, …>` 표들이 조용히 통과한다. 문장과 목적지는 1차 열여덟만 내고
 * 2차는 널이다.
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

/**
 * 목록에서 유일하게 안 눌리는 종류다 — 갈 곳이 없어 여는 것으로 읽음이 찍힌다.
 *
 * 타입을 `NotificationKind`로 안 적고 목록에서 바로 꺼내는 것은, 그 이름이 이 목록 위에
 * 서는 타입이라 당기면 두 파일이 서로를 당기게 되기 때문이다.
 */
export const ADMIN_NOTICE: (typeof NOTIFICATION_KINDS)[number] = "admin_notice";

/**
 * 한 쪽에 담는 수다. 읽는 손(`api/getNotifications.api.ts`의 `range()`)과 다음 쪽이 있는지를
 * 세는 손(`services/useNotificationsQuery.ts`)이 같은 수를 봐야 해서, 둘 다 아는 아래층에
 * 둔다 — 쪽이 이 수보다 적게 오면 그것이 마지막 쪽이다.
 */
export const NOTIFICATION_PAGE_SIZE = 50;

/**
 * 쥐고 있는 쪽 수의 한도다. 지난 알림을 안 지우는 규칙이라(NTF-026) 한 사람의 목록이 해마다
 * 길어지는데, 이 수가 끝없이 내려도 메모리가 안 늘게 막는다 — 위로 되감으면 앞 쪽을 다시
 * 읽는다. 쪽 크기와 같은 자리에 두는 것은 둘이 같은 질의의 설정이라서다.
 */
export const NOTIFICATION_MAX_PAGES = 3;

/**
 * 관리자 화면이 남의 갈래를 볼 때 쓰는 권한 값이다. 기기 권한은 그 사람의 기기에만 있는
 * 값이라 `push_reachable`에도 안 오고 올 길도 없다 — 거부 갈래는 그 사람의 「나」 화면에서만
 * 선다. 남을 볼 때 판정에 드는 축은 의사와 기기 둘뿐이라는 뜻이다.
 */
export const PERMISSION_OF_OTHERS: PushPermission = "granted";

/** 닿는 갈래다. 화면이 「알림이 간다」를 물을 때 견주는 값이라 이름을 밖에 둔다. */
export const REACHABLE: ReachState = "reachable";

/** 한 번에 부치는 메시지 수다. Expo가 한 요청에 받는 한도다. */
export const PUSH_MESSAGES_PER_REQUEST = 100;

/**
 * 알림이 거부된 자리에 세우는 문안 둘이다. 「나」 화면과 승인 대기 화면이 같은 문장을 쓴다 —
 * 거기서 거부한 사람이 여기로 온다
 * ([NTF-028](../../../../docs/2-design/modules/notification/README.md#ntf-028)).
 */
export const PUSH_DENIED_TITLE = "알림이 꺼져 있어요";

export const PUSH_DENIED_SUBLINE = "기기 설정에서 알림을 켜면 받을 수 있어요";
