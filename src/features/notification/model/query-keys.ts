/**
 * 알림이 캐시에서 건드리는 키 둘이다. `docs/2-design/system/runtime.md`의 「TanStack Query
 * 규칙」이 키를 `[도메인, 범위]`로 정했고, 무효화 짝은
 * `docs/2-design/modules/notification/design.md`의 「읽음 찍기」가 든다.
 *
 * **둘을 같이 무효화한다.** `['notifications']`가 `['notifications', 'unread']`의 접두사라
 * 앞의 하나로 뒤까지 닿지만, 읽음을 찍는 자리는 둘을 나란히 적는다 — 안 읽은 수가 종
 * 아이콘의 점이라 그 자리가 눈에 보여야 한다.
 *
 * 목록은 `useInfiniteQuery`라 키 아래 쪽이 쌓이고, 안 읽은 수는 행을 안 받는 count 질의라
 * 범위를 따로 뗀다.
 */

export const NOTIFICATIONS_KEY = ["notifications"] as const;

export const NOTIFICATIONS_UNREAD_KEY = ["notifications", "unread"] as const;

/** 영속되는 쪽 수다 — 끝없이 내려도 메모리가 안 는다(design.md 「소유 데이터」). */
export const NOTIFICATIONS_MAX_PAGES = 3;
