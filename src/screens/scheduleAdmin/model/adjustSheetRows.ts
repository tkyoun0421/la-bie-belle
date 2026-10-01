import {
  dayTotal,
  type RehearsalRow,
} from "@/entities/rehearsal/model/rehearsalHours";
import {
  adjustedMinutes,
  dayMinutes,
  type AdjustmentRow,
  type WorkDayHours,
} from "@/features/payroll/model/dayMinutes";
import { assignedMinutes } from "@/screens/scheduleAdmin/model/absenceMinutes";

/**
 * 근무 조정 시트의 사람 줄들이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 조정」이다.
 *
 * **그날 배정에서 출발한다.** 살아 있는 배정만 서고 교육 배정도 든다(PAY-007). 리허설만 있고
 * 배정이 없는 사람은 이 목록에 없다 — 그 사람을 보는 자리는 리허설 화면이다.
 *
 * **줄마다 그날 최종 시간이 선다.** 배정 시간 + 조정 + 리허설이고, 셈은 급여가 쓰는
 * [`dayMinutes`](../../../features/payroll/model/dayMinutes.ts) 그대로다 — 여기서 다시 짜면
 * 급여 화면과 이 시트가 다른 시간을 말한다(PAY-028).
 *
 * **앞머리는 마지막 조정 행의 부호가 정한다.** 되돌린 사람(마지막 행이 0분)에게는 안 붙는다.
 *
 * **리허설 줄은 이미 선 행의 갈래를 그대로 적는다.** 건수 갈래는 건수를, 시각 갈래는 구간을
 * 앞에 두고 뒤에 시간이 붙는다(`docs/2-design/modules/schedule/design.md`의 「리허설」).
 */

const MINUTES_PER_HOUR = 60;

const CLOCK_LENGTH = 5;

export type AdjustSheetAssignment = {
  profile_id: string;
  name: string;
  kind: string;
  ended_at: string | null;
};

export type AdjustSheetAdjustment = AdjustmentRow & { profile_id: string };

export type AdjustSheetRehearsal = RehearsalRow & { profile_id: string };

export type AdjustmentKind = "결근" | "연장";

export type AdjustSheetRow = {
  profile_id: string;
  name: string;
  finalMinutes: number;
  adjustmentKind: AdjustmentKind | null;
  rehearsalLine: string | null;
};

export type AdjustSheetInput = {
  day: WorkDayHours;
  assignments: readonly AdjustSheetAssignment[];
  adjustments: readonly AdjustSheetAdjustment[];
  rehearsals: readonly AdjustSheetRehearsal[];
};

/** 「9시간」·「0시간」·「1시간 30분」·「30분」. 0은 「0시간」이다 — 결근한 줄의 값이라서다. */
export function spellHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (rest === 0) {
    return `${hours}시간`;
  }

  return hours === 0 ? `${rest}분` : `${hours}시간 ${rest}분`;
}

/** DB는 초까지 싣고 화면은 안 싣는다 — 「14:00:00」이 「14:00」이다. */
function clock(value: string): string {
  return value.slice(0, CLOCK_LENGTH);
}

/** 시트 머리다 — 「10:00–19:00 · 9시간」. */
export function adjustSheetHead(day: WorkDayHours): string {
  return `${clock(day.starts_at)}–${clock(day.ends_at)} · ${spellHours(
    assignedMinutes(day),
  )}`;
}

/**
 * 줄을 읽어 주는 이름이다 — 「정민아 · 결근 0시간」. 이름과 시간이 그리는 자리에서 떨어져 있어
 * (`AdjustSheet.tsx`) 낭독기와 화면 밖에서 이 줄을 찾는 손에는 한 덩이로 실어 준다.
 */
export function adjustRowLabel(row: AdjustSheetRow): string {
  const time = spellHours(row.finalMinutes);
  const spelled =
    row.adjustmentKind === null ? time : `${row.adjustmentKind} ${time}`;

  return `${row.name} · ${spelled}`;
}

function kindOf(minutes: number): AdjustmentKind | null {
  if (minutes === 0) {
    return null;
  }

  return minutes < 0 ? "결근" : "연장";
}

function isClockRow(row: RehearsalRow): boolean {
  return row.count === null && row.starts_at !== null && row.ends_at !== null;
}

function rehearsalLineOf(rows: readonly RehearsalRow[]): string | null {
  if (rows.length === 0) {
    return null;
  }

  const total = dayTotal(rows);
  const only = rows.length === 1 ? rows[0] : null;

  if (only !== null && isClockRow(only)) {
    return `리허설 ${clock(only.starts_at ?? "")}–${clock(
      only.ends_at ?? "",
    )} · ${spellHours(total.minutes)}`;
  }

  return `리허설 ${total.count}건 · ${spellHours(total.minutes)}`;
}

export function adjustSheetRows(input: AdjustSheetInput): AdjustSheetRow[] {
  return input.assignments
    .filter((assignment) => assignment.ended_at === null)
    .map((assignment) => {
      const adjustments = input.adjustments.filter(
        (row) => row.profile_id === assignment.profile_id,
      );
      const rehearsals = input.rehearsals.filter(
        (row) => row.profile_id === assignment.profile_id,
      );

      return {
        profile_id: assignment.profile_id,
        name: assignment.name,
        finalMinutes: dayMinutes({
          assignments: [assignment],
          day: input.day,
          adjustments,
          rehearsals,
        }),
        adjustmentKind: kindOf(adjustedMinutes(adjustments)),
        rehearsalLine: rehearsalLineOf(rehearsals),
      };
    });
}
