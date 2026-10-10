import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { spellDate } from "@/shared/utils/kstDate";
import { monthIn } from "@/shared/utils/monthIn";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { STATS_COPY } from "@/features/stats/consts/stats.const";
import {
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";
import { computePersonDays } from "@/features/stats/utils/personDays.utils";

export type WorkDaysSheetRow = {
  key: string;
  title: string;
  value: string;
};

export type WorkDaysSheetController =
  | { state: "pending" }
  | { state: "failed" }
  | {
      state: "ready";
      name: string;
      rows: WorkDaysSheetRow[];
      total: string;
    };

export function useWorkDaysSheet(
  month: string,
  profileId: string,
): WorkDaysSheetController {
  const months = useMemo(() => [month], [month]);

  const work = useWorkMonthsQuery(supabase, months);

  const inputs = useMemo(
    () => workInputsOf(monthIn(work.data, month)?.days ?? []),
    [work.data, month],
  );

  const personDays = useMemo(
    () => computePersonDays(profileId, inputs.assignments, inputs.days),
    [profileId, inputs],
  );

  if (work.isLoading) {
    return { state: "pending" };
  }

  if (work.error !== null) {
    return { state: "failed" };
  }

  return {
    state: "ready",
    name:
      inputs.assignments.find(
        (assignment) => assignment.profileId === profileId,
      )?.displayName ?? "",
    rows: personDays.days.map((row) => ({
      key: `${row.workDate}-${row.position}`,
      title: `${spellDate(row.workDate)} · ${row.label}`,
      value: hoursLabel(row.minutes),
    })),
    total: `${STATS_COPY.totalPrefix}${personDays.totalCount}${STATS_COPY.timesSuffix} · ${hoursLabel(personDays.totalMinutes)}`,
  };
}
