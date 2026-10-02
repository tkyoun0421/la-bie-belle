import type {
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/stats.type";
import {
  dayMinutes,
  isLiveAssignment,
} from "@/features/stats/model/workTotals.policy";

/**
 * 근무 내역 시트가 답하는 것 하나 — 「이 시간이 어느 날들에서 나왔나」다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「근무 내역 시트」고 완료 조건은
 * `docs/2-design/spec/stats-admin.md`의 AC-02다.
 *
 * **합계가 구획 줄의 값과 같다.** 같은 배정을 [`workTotals.ts`](workTotals.ts)와 같은
 * 규칙으로 세므로 시트를 열어 눈으로 검산할 수 있다 — 그것이 이 시트의 쓸모다.
 *
 * **겸임인 날도 한 줄이다.** 배정 하나가 줄 하나고 그 `position`이 이미 앞 포지션이라 두
 * 포지션을 다 적을 길이 없다 — 적으면 시간이 두 번 든 것처럼 읽힌다.
 *
 * **교육 배정은 어느 포지션의 교육이었는지를 적는다** — 「안내 교육」 꼴이다. 그 글이
 * `label`이고 `position`은 그대로 남는다 — 시트가 줄의 열쇠를 그것으로 짠다.
 *
 * **날짜순이다.** 한 달을 따라 읽는 자리라 달력 순서가 그대로 순서고, 시간 긴 날이 위로 오지
 * 않는다.
 */

const TRAINING_KIND = "training";

export type PersonDayRow = {
  workDate: string;
  position: string;
  label: string;
  minutes: number;
};

export type PersonDays = {
  days: PersonDayRow[];
  totalMinutes: number;
  totalCount: number;
};

export function computePersonDays(
  profileId: string,
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
): PersonDays {
  const dayById = new Map(days.map((day) => [day.id, day]));

  const rows = assignments
    .filter(
      (assignment) =>
        isLiveAssignment(assignment) && assignment.profile_id === profileId,
    )
    .flatMap((assignment) => {
      const day = dayById.get(assignment.day_id);

      return day === undefined
        ? []
        : [
            {
              workDate: day.work_date,
              position: assignment.position,
              label: rowLabel(assignment),
              minutes: dayMinutes(day),
            },
          ];
    })
    .sort((left, right) => left.workDate.localeCompare(right.workDate));

  return {
    days: rows,
    totalMinutes: rows.reduce((sum, row) => sum + row.minutes, 0),
    totalCount: rows.length,
  };
}

function rowLabel(assignment: WorkAssignment): string {
  return assignment.kind === TRAINING_KIND
    ? `${assignment.position} 교육`
    : assignment.position;
}
