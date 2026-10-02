import type { TALLIED_STATUSES } from "@/entities/attendance/consts/attendance.const";

/**
 * 근태의 모양이다. 상태 여섯과 그것을 내는 데 필요한 재료, 그리고 달치로 센 결과다.
 *
 * **상태를 내는 함수는 하나다** — [`attendanceStatus.policy.ts`](attendanceStatus.policy.ts)고,
 * 이 타입들을 받는 쪽이 근태 화면·통계·급여 셋이다. 세 자리가 각자 재료 꼴을 적으면 판정에
 * 넣는 값이 자리마다 달라진다.
 */

export type AttendanceStatus =
  "unmarked" | "present" | "late" | "pending" | "excused" | "absent";

export type CheckInRecord = {
  checkedAt: string;
  reportedAt: string;
  receivedAt: string;
};

export type ExcuseDecision = "approved" | "rejected";

export type ExcuseStatusRecord = {
  submittedAt: string;
  decidedAt: string | null;
  decision: ExcuseDecision | null;
};

export type AttendanceStatusInput = {
  workDate: string;
  startsAt: string;
  endsAt: string;
  checkIn: CheckInRecord | null;
  excuses: ExcuseStatusRecord[];
  now: string;
};

/** 달치 집계가 세는 네 갈래다 — 목록은 `consts`가 든다. */
export type TalliedStatus = (typeof TALLIED_STATUSES)[number];

export type MonthlyAttendanceTally = Record<TalliedStatus, number>;

/** 현황 줄이 드는 꼴이다 — 0인 갈래는 키 자체가 없어 줄에서 빠진다. */
export type AttendanceSummary = Partial<Record<AttendanceStatus, number>>;
