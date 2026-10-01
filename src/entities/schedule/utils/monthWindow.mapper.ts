import type { MonthWindowRow } from "@/entities/schedule/api/schedule.dto";
import type { MonthWindow } from "@/entities/schedule/model/schedule.type";

/**
 * 근무표 행의 DB 열 이름을 도메인 모양으로 옮긴다. 질의가 꼴을 바꾸는 유일한 자리라
 * 그 손만 여기 섰다 — 나머지 넷은 생 꼴을 그대로 내보내고, 그것을 매퍼로 돌리는 일은
 * `dto-to-domain-shape`가 받았다.
 */
export function toMonthWindow(row: MonthWindowRow): MonthWindow {
  return {
    applicationDeadline: row.application_deadline,
    confirmedAt: row.confirmed_at,
  };
}
