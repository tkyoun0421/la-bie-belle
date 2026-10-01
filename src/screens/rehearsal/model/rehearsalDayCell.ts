import { spellMinutes } from "@/screens/rehearsal/model/spellTotal";

/**
 * 달력 칸의 바닥 단이다(`docs/2-design/modules/schedule/screens/rehearsal.md`의 「달력 칸」).
 *
 * **바닥 단이 건수가 아니라 시간이다.** 「2건」이 아니라 「2시간」이고, 이 자리가 근무표
 * 달력과 가장 다르다 — 시각으로 넣은 것과 건수로 넣은 것이 한 달력에 같이 서는데 건수로
 * 적으면 둘이 다른 뜻이 된다. 급여가 세는 단위로 통일한다.
 *
 * 관리자 칸은 그날 전원을 더한 시간이다. 누구 것인지는 날 시트가 말한다.
 */

export type RehearsalDayCellState = "empty" | "has";

export type RehearsalDayCell = {
  state: RehearsalDayCellState;
  label: string;
};

export function rehearsalDayCell(minutes: number): RehearsalDayCell {
  if (minutes === 0) {
    return { state: "empty", label: "" };
  }

  return { state: "has", label: spellMinutes(minutes) };
}
