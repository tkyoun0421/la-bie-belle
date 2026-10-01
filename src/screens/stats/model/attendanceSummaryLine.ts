import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance-summary";

/**
 * 근태 탭 현황 줄이다 — 「출근 41 · 지각 4 · 출근 인정 2 · 결근 1」
 * (`docs/2-design/system/screens/stats.md`의 「근태 현황 줄」·「통계 문안」).
 *
 * **순서가 문서 표 그대로다.** 출근·지각·출근 인정·결근이고, 바로 아래 비율 띠의 몫 순서
 * (출근·인정·지각·결근)와 다르다 — 띠는 색 자리가 고정이라 순서가 다른 것이 어긋남이 아니다.
 *
 * **0인 몫도 안 빠진다.** 띠 아래 범례는 몫이 0이면 통째로 빠지지만 이 줄은 넷을 늘 다 적는다 —
 * 그달의 사실을 세는 자리라 「결근 0」이 읽을 거리다. 사람별 목록 줄이 「지각 0」을 비우는 것과도
 * 갈린다. 거기는 줄이 세로로 쌓여 0이 실제 지각을 가리는 자리다.
 */

export function attendanceSummaryLine(tally: MonthlyAttendanceTally): string {
  return [
    `출근 ${tally.present}`,
    `지각 ${tally.late}`,
    `출근 인정 ${tally.excused}`,
    `결근 ${tally.absent}`,
  ].join(" · ");
}
