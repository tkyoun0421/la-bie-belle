/**
 * 관리자 통계가 쓰는 정해진 값과 문안이다. 정본은
 * `docs/2-design/system/screens/stats.md`의 관리자 몫이다.
 */

import type { TalliedStatus } from "@/entities/attendance/model/attendance.type";

/**
 * 관리자 통계의 탭 둘이다.
 *
 * **급여 탭이 없다.** 이 화면이 세는 것은 시간과 회수와 비율이고 시급을 아예 안 읽는다.
 */
export const ADMIN_STATS_TABS = ["work", "attendance"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "work", label: "근무" },
  { value: "attendance", label: "근태" },
];

/**
 * 비율 띠의 몫 넷과 그 글자다.
 *
 * **순서가 곧 색이다.** 출근→인정→지각→결근이고 비율 띠가 자리 순서로 색을 준다 — 몫이
 * 빠져도 남은 몫의 색이 안 밀리게 하려면 이 순서가 고정이어야 한다. 바로 위 현황 줄의
 * 순서(출근·지각·출근 인정·결근)와 다른 것이 어긋남이 아니다.
 *
 * **근무자 통계가 같은 표를 각자 든다.** 두 슬라이스가 서로를 못 불러서(lint 규칙 3)
 * `screens/stats`에도 같은 표가 있고, 접는 것은 AC-13이 받는다.
 */
export const SHARE_LABELS: readonly { key: TalliedStatus; label: string }[] = [
  { key: "present", label: "출근" },
  { key: "excused", label: "인정" },
  { key: "late", label: "지각" },
  { key: "absent", label: "결근" },
];

/** 관리자 통계의 문안이다. */
export const ADMIN_STATS_COPY = {
  appBarTitle: "통계",
  emptyTitle: "이 달은 아직 근무표가 없어요",
  emptyBody: "근무를 넣으면 여기 숫자가 서요",
  readFailed: "통계를 불러오지 못했어요",
  retry: "다시 시도",
  peopleSection: "사람별",
  positionSection: "포지션",
  workCountPrefix: "근무 ",
  workCountSuffix: "건",
  countSuffix: "건",
  timesSuffix: "회",
  totalPrefix: "합계 · ",
} as const;

/** 줄 왼쪽 동그란 사진의 지름이다. */
export const AVATAR_SIZE = 40;

/** 날짜에서 달을 떼는 글자 수다 — `"2026-10-10"`의 앞 일곱이 `"2026-10"`이다. */
export const MONTH_LENGTH = 7;
