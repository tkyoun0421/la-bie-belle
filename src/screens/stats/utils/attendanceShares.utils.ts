import type {
  MonthlyAttendanceTally,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";

/**
 * 근태 탭 비율 띠의 몫 넷이다(`docs/2-design/system/screens/stats.md`의 「근태 현황 줄」).
 *
 * **순서가 곧 색이다.** 출근→인정→지각→결근이고 비율 띠가 자리 순서로 색을 준다 — 몫이
 * 빠져도 남은 몫의 색이 안 밀리게 하려면 이 순서가 고정이어야 한다.
 *
 * **여기서는 「인정」이다.** 현황 줄이 「출근 인정」으로 적는 것을 범례는 줄인다
 * (stats.md 「통계 문안」의 「근태 범례」).
 *
 * **0인 몫도 자리는 남긴다.** 감추는 것은 비율 띠가 그릴 때 할 일이지 이 셈의 몫이 아니다.
 */

export type AttendanceShare = {
  key: TalliedStatus;
  label: string;
  value: number;
};

const SHARE_LABELS: readonly { key: TalliedStatus; label: string }[] = [
  { key: "present", label: "출근" },
  { key: "excused", label: "인정" },
  { key: "late", label: "지각" },
  { key: "absent", label: "결근" },
];

export function attendanceRatioShares(
  tally: MonthlyAttendanceTally,
): AttendanceShare[] {
  return SHARE_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: tally[key],
  }));
}
