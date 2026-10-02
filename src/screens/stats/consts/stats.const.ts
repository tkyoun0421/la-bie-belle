/**
 * 근무자 통계가 쓰는 정해진 값이다. 정본은 `docs/2-design/system/screens/stats.md`의
 * 「통계 문안」과 「근태 현황 줄」이다.
 */

import type { AttendanceStatus } from "@/entities/attendance/model/attendance.type";
import type { TalliedStatus } from "@/entities/attendance/model/attendance.type";
import type { PayrollDayKind } from "@/features/payrollCompute/model/payrollDays.policy";

/**
 * 날짜 목록이 상태 여섯을 적는 글자다.
 *
 * **여섯을 줄이지도 늘리지도 않는다.** 정본은 `attendance/design.md`고, 근무표 명단이 쓰는
 * 「아직 안 찍음」은 그 화면의 자리 사정이라 여기로 안 온다.
 */
export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "출근",
  late: "지각",
  unmarked: "안 찍음",
  pending: "확인 중",
  excused: "인정",
  absent: "결근",
};

/**
 * 비율 띠의 몫 넷과 그 글자다.
 *
 * **순서가 곧 색이다.** 출근→인정→지각→결근이고 비율 띠가 자리 순서로 색을 준다 — 몫이
 * 빠져도 남은 몫의 색이 안 밀리게 하려면 이 순서가 고정이어야 한다. 바로 위 현황 줄의
 * 순서(출근·지각·출근 인정·결근)와 다른 것이 어긋남이 아니다.
 *
 * **여기서는 「인정」이다.** 현황 줄이 「출근 인정」으로 적는 것을 범례는 줄인다.
 */
export const SHARE_LABELS: readonly { key: TalliedStatus; label: string }[] = [
  { key: "present", label: "출근" },
  { key: "excused", label: "인정" },
  { key: "late", label: "지각" },
  { key: "absent", label: "결근" },
];

/** 날짜에서 달을 떼는 글자 수다 — `"2026-10-10"`의 앞 일곱이 `"2026-10"`이다. */
export const MONTH_LENGTH = 7;

/** 급여 보조 줄이 세지 않는 날이다 — 결근한 날은 금액도 건수도 0이다. */
export const ABSENT: PayrollDayKind = "absent";

/**
 * 근무자 통계의 탭 셋이다.
 *
 * **급여가 여기만 있다.** 관리자 통계에는 그 탭이 없다 — 자기 급여를 보는 것은 홀 전체
 * 인건비를 보는 것과 다른 자리다.
 */
export const STATS_TABS = ["attendance", "position", "payroll"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "attendance", label: "근태" },
  { value: "position", label: "포지션" },
  { value: "payroll", label: "급여" },
];

/** 근무자 통계의 문안이다. 정본은 같은 문서의 「통계 문안」이다. */
export const STATS_COPY = {
  appBarTitle: "통계",
  emptyTitle: "이 달은 근무가 없어요",
  emptyBody: "근무가 잡히면 여기 숫자가 서요",
  historyRow: "내역 보기",
  readFailed: "통계를 불러오지 못했어요",
  retry: "다시 시도",
  /**
   * 예상치 안내다.
   *
   * **같은 말이 급여 화면에도 있다.** 두 슬라이스가 서로를 못 불러서(lint 규칙 3) 각자
   * 들고 있고, 접는 것은 AC-13이 받는다.
   */
  estimateNote: "예상치예요. 실제 지급액과 다를 수 있어요",
  countSuffix: "건",
} as const;
