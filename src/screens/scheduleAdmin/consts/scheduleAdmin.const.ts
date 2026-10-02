/**
 * 관리자 근무표 화면이 쓰는 정해진 값이다. 어느 기기에서 돌든 같아서 `consts`가 집이다.
 */

/**
 * 자격을 보는 포지션 다섯이다. 나머지 넷 — 축가·안내·매니저·대기실 — 은 누구나
 * 들어간다(SCH-013).
 */
export const RESTRICTED_POSITIONS = [
  "팀장",
  "스캔",
  "메인",
  "드레스",
  "드레스실",
] as const;

/**
 * 승인할 일에서 근무 취소를 승인하면 그 자리를 채우러 이 화면으로 온다. 떠나는 화면이
 * 아니라 닿는 화면이 토스트를 띄워서 그 이름이 양쪽에 같은 글자로 있어야 한다
 * (`docs/2-design/system/navigation.md`의 「경로」).
 *
 * 알림 목록 쪽 이름은 `@/shared/consts/navigation.const`가 든다 — 그 자리에 둘째 이름을
 * 세우는 것이 맞지만 공용을 안 건드리는 묶음이라 여기 둔다.
 */
export const ORIGIN_APPROVALS = "approvals";

/** 빈 상태의 달력 아이콘 크기다. */
export const EMPTY_ICON_SIZE = 44;

/**
 * 화면이 그대로 그리는 글자다. 달 이름이 섞이는 줄은 접두·접미로 갈라 controller가 잇는다.
 */
export const SCHEDULE_ADMIN_COPY = {
  stopPicking: "그만두기",
  pickingTitle: "열 날을 고르세요",
  startPicking: "날 열기",
  confirmedBadge: "확정",
  pickingHint: "닫힌 날만 고를 수 있어요",
  allClosed: "전부 닫힌 날이에요. 예식 있는 날을 열어주세요",
  applicationsHint: "사람 표시는 근무 신청이에요",
  applicationsPrefix: "근무 신청 ",
  applicationsSuffix: "건 모아보기",
  monthMissing: " 근무표가 없어요",
  monthNotYet: " 근무표가 아직 없어요",
  createHintPrefix: "만들면 근무자들이 ",
  createHintSuffix: " 근무 신청을 넣을 수 있어요",
  createSuffix: " 근무표 만들기",
  confirmLocked: "확정하기",
  confirmSuffix: " 근무표 확정하기",
  pullDeadline: "· 마감일 당기기",
  arrivedFromApprovals: "근무를 취소했어요",
  holidayLabel: "임시공휴일",
  adjustLabel: "근무 조정",
  closeDay: "이 날 닫기",
  discardZoneLabel: "여기에 놓으면 자리를 지워요",
  discardZoneActiveLabel: "놓으면 지워져요",
  mergeInstead: "겸임은 자리를 합쳐 만드세요",
} as const;

/**
 * 조정 행에 그대로 실려 가는 사유 셋이다 — 함수가 갈래를 모르고 분과 사유만 받아서
 * (`docs/2-design/modules/payroll/design.md`의 「조정」) 이 글자가 곧 갈래다.
 */
export const ADJUSTMENT_REASON = {
  absence: "결근",
  extra: "연장",
  revert: "원래대로",
} as const;
