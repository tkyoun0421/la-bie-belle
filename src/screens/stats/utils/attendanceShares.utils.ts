import type {
  MonthlyAttendanceTally,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";
import { SHARE_LABELS } from "@/screens/stats/consts/stats.const";

/**
 * 근태 탭 비율 띠의 몫 넷이다(`docs/2-design/system/screens/stats.md`의 「근태 현황 줄」).
 *
 * **순서와 글자는 `consts`가 든다** — 순서가 곧 색이라 그 표가 정본이다.
 *
 * **0인 몫도 자리는 남긴다.** 감추는 것은 비율 띠가 그릴 때 할 일이지 이 셈의 몫이 아니다.
 */

export type AttendanceShare = {
  key: TalliedStatus;
  label: string;
  value: number;
};

export function attendanceRatioShares(
  tally: MonthlyAttendanceTally,
): AttendanceShare[] {
  return SHARE_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: tally[key],
  }));
}
