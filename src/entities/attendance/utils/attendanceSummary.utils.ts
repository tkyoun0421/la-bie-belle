import { TALLIED_STATUSES } from "@/entities/attendance/consts/attendance.const";
import {
  getAttendanceStatus,
  type AttendanceStatus,
  type AttendanceStatusInput,
} from "@/entities/attendance/model/attendanceStatus.policy";

/**
 * 한 달치 근태를 네 갈래로 센다. 판정은 [`attendanceStatus.ts`](attendanceStatus.ts)의
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
 *
 * **출근율도 여기 산다.** 관리자 통계와 근무자 통계가 같은 공식을 쓰는데 둘이 다른
 * 슬라이스라 서로를 못 부른다(lint 규칙 3) — 세는 함수 옆이 그 공식의 자리다.
 */

const PERCENT = 100;

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

/**
 * 인증이 실제로 몇 번 돌았나다(stats.md 「추이 그래프」). 출근을 넷의 합으로 나누고 출근
 * 인정은 분모에만 든다 — 사유가 받아들여진 날은 불이익이 없는 것이지 인증이 돈 날이 아니다
 * (ATT-023).
 *
 * **넷이 다 0이면 `null`이다.** 나눌 것이 없는 달이라 그래프가 점을 안 찍는다. 그 달을 아예
 * 안 읽은 자리도 같은 `null`을 받는다 — 둘 다 그릴 값이 없다.
 */
export function attendanceRate(
  tally: MonthlyAttendanceTally | undefined,
): number | null {
  if (tally === undefined) {
    return null;
  }

  const counted = tally.present + tally.late + tally.absent + tally.excused;

  return counted === 0 ? null : Math.round((tally.present / counted) * PERCENT);
}
