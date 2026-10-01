import {
  checkInWindowOpensAt,
  type AttendanceStatus,
  type AttendanceStatusInput,
} from "@/entities/attendance/model/attendanceStatus";
import type { AttendanceSummary } from "@/entities/attendance/model/summarizeAttendanceStatuses";

/**
 * 날 시트 명단의 오른쪽 끝 열과 그 위 현황 줄이다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「인증 상태」).
 *
 * **창이 열리기 전에는 열이 통째로 없다.** 다음 주 토요일 명단에 「아직 안 찍음」이 열한 줄
 * 서면 안 온 사람들처럼 읽힌다. 창이 열리는 시각의 정본은
 * [ATT-008](../../../../docs/2-design/modules/attendance/README.md#att-008)이고 계산은
 * `attendanceStatus.ts`가 소유한다 — 여기서 다시 세지 않는다.
 */
export function isAttendanceColumnVisible(
  input: AttendanceStatusInput,
): boolean {
  return Date.parse(input.now) >= checkInWindowOpensAt(input);
}

/**
 * 현황 줄이다 — 「11명 중 9명 출근 · 지각 1 · 아직 1」. 출근 수가 앞에 서고 나머지 다섯이 날
 * 시트 문안 표의 차례로 붙는다.
 *
 * **0인 항목은 뺀다.** 그날 그런 사람이 없다는 것을 「지각 0」으로 말하면 줄이 늘 같은 길이가
 * 되어 무엇이 일어났는지가 안 보인다.
 */
const REST_LABELS: [AttendanceStatus, string][] = [
  ["late", "지각"],
  ["unmarked", "아직"],
  ["pending", "확인 중"],
  ["excused", "출근 인정"],
  ["absent", "결근"],
];

export function attendanceSummaryLine(
  summary: AttendanceSummary,
  total: number,
): string {
  const present = summary.present ?? 0;
  const rest = REST_LABELS.filter(([status]) => (summary[status] ?? 0) > 0).map(
    ([status, label]) => `${label} ${summary[status]}`,
  );

  if (rest.length === 0 && present === total) {
    return `${total}명 전원 출근`;
  }

  return [`${total}명 중 ${present}명 출근`, ...rest].join(" · ");
}
