/**
 * 관리자 통계 근태 탭이 그리는 값의 모양이다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「근태 현황 줄」·「근태 사람별 목록」이다.
 *
 * **현황 줄과 목록이 한 꼴에 든다.** 둘이 같은 셈에서 나와야 목록의 합과 위 줄이 안 어긋나서고,
 * 그래프 값도 이 꼴의 `tally`를 그대로 읽는다.
 *
 * **0인 몫이 `null`이다.** 「지각 0」을 세로로 쌓으면 0이 줄마다 서서 실제로 지각한 사람이
 * 안 보인다 — 출근만 늘 서는 기본 값이라 숫자로 남는다.
 */

import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";

export type AttendanceRow = {
  profileId: string;
  displayName: string;
  present: number;
  late: number | null;
  absent: number | null;
  excused: number | null;
};

export type AttendanceTab = {
  tally: MonthlyAttendanceTally;
  rows: AttendanceRow[];
};
