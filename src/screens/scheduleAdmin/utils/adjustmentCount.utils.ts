import { adjustedMinutes } from "@/features/payrollCompute/model/dayMinutes.policy";

/**
 * 날 상세 근무 조정 줄 오른쪽의 셈이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 조정」이다.
 *
 * **세는 것은 마지막 조정 행의 분이 0이 아닌 사람이다.** 이 줄이 말하는 것은 「지금 손본 사람이
 * 몇인가」라, 되돌린 사람은 행이 남아 있어도 손본 사람이 아니다 — 조정 고르기 시트의
 * 「원래대로」가 행의 유무만 보는 것과 갈리는 자리다.
 *
 * **0명이면 자리가 빈다.** 「0명 조정됨」을 안 적는다 — 손본 것이 없다는 말은 빈 자리가 이미
 * 하고 있다.
 */

export type AdjustmentCountRow = {
  profile_id: string;
  minutes: number;
  adjusted_at: string;
};

function rowsByProfile(
  rows: readonly AdjustmentCountRow[],
): Map<string, AdjustmentCountRow[]> {
  const grouped = new Map<string, AdjustmentCountRow[]>();

  for (const row of rows) {
    const kept = grouped.get(row.profile_id) ?? [];

    kept.push(row);
    grouped.set(row.profile_id, kept);
  }

  return grouped;
}

function adjustedProfileCount(rows: readonly AdjustmentCountRow[]): number {
  return [...rowsByProfile(rows).values()].filter(
    (mine) => adjustedMinutes(mine) !== 0,
  ).length;
}

export function adjustmentCountLine(
  rows: readonly AdjustmentCountRow[],
): string {
  const count = adjustedProfileCount(rows);

  return count === 0 ? "" : `${count}명 조정됨`;
}
