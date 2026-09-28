import {
  getAttendanceStatus,
  type AttendanceStatus,
  type AttendanceStatusInput,
} from "@/entities/attendance/model/attendance-status";

/**
 * 한 달치 근태를 네 갈래로 센다. 판정은 [`attendance-status.ts`](attendance-status.ts)의
 * `getAttendanceStatus` 하나고 여기서 다시 짜지 않는다 — 세는 자리가 판정을 따로 가지면
 * 화면에 뜬 상태와 집계가 갈린다.
 *
 * **출근과 출근 인정을 합치지 않는다**(ATT-023). 인정된 날은 `excused`만 오른다.
 *
 * **확인 중과 안 찍음은 어디에도 안 든다.** 아직 결말이 안 난 날이라 넷 중 어디에
 * 얹어도 그 달의 사실이 아니다.
 *
 * 판정 옆인 entities에 사는 것은 근태 화면과 통계 화면이 같은 셈을 나눠 쓰기 때문이다 —
 * 어느 한쪽 슬라이스가 들고 있으면 다른 쪽이 층을 가로질러 부르게 된다.
 */

const TALLIED_STATUSES = ["present", "late", "absent", "excused"] as const;

export type TalliedStatus = (typeof TALLIED_STATUSES)[number];

export type MonthlyAttendanceTally = Record<TalliedStatus, number>;

function isTallied(status: AttendanceStatus | null): status is TalliedStatus {
  return (TALLIED_STATUSES as readonly (AttendanceStatus | null)[]).includes(
    status,
  );
}

export function tallyMonthlyAttendance(
  days: AttendanceStatusInput[],
): MonthlyAttendanceTally {
  const tally: MonthlyAttendanceTally = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  };

  for (const day of days) {
    const status = getAttendanceStatus(day);
    if (isTallied(status)) {
      tally[status] += 1;
    }
  }

  return tally;
}
