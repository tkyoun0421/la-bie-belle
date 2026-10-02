import type {
  MonthlyAttendanceTally,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";
import { SHARE_LABELS } from "@/screens/adminStats/consts/adminStats.const";

/**
 * 관리자 통계 근태 탭의 현황 줄과 비율 띠 몫이다
 * (`docs/2-design/system/screens/stats.md`의 「근태 현황 줄」).
 *
 * **순서가 둘 다 고정인데 서로 다르다.** 현황 줄은 문서 표 순서(출근·지각·출근 인정·결근)고
 * 띠는 색 자리 순서(출근·인정·지각·결근)다 — 어긋남이 아니다.
 *
 * **0인 몫을 현황 줄은 적고 띠는 안 그린다.** 줄은 그달의 사실을 세는 자리라 「결근 0」이
 * 읽을 거리고, 띠에서 0을 빼는 일은 비율 띠가 그릴 때 한다.
 *
 * 근무자 통계가 같은 값을 자기 `utils`에 든다 — 두 슬라이스가 서로를 못 불러서고(lint
 * 규칙 3) 접는 것은 AC-13이 받는다.
 */

export type AdminAttendanceShare = {
  key: TalliedStatus;
  label: string;
  value: number;
};

export function adminAttendanceLine(tally: MonthlyAttendanceTally): string {
  return [
    `출근 ${tally.present}`,
    `지각 ${tally.late}`,
    `출근 인정 ${tally.excused}`,
    `결근 ${tally.absent}`,
  ].join(" · ");
}

export function adminAttendanceShares(
  tally: MonthlyAttendanceTally,
): AdminAttendanceShare[] {
  return SHARE_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: tally[key],
  }));
}
