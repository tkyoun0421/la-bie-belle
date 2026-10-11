import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import type { ListRowValueTone } from "@/shared/ui/ListRow";
import { monthIn } from "@/shared/utils/monthIn";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { STATS_COPY } from "@/features/stats/consts/stats.const";
import {
  computeWorkTotals,
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";

export type AdminStatsPersonRow = {
  key: string;
  profileId: string;
  displayName: string;
  detail: string;
  value: string;
  weight: number;
};

export type AdminStatsPositionRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
  weight: number;
  valueTone: ListRowValueTone;
};

export type AdminStatsWorkController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | {
      state: "ready";
      totalLabel: string;
      countLine: string;
      peopleRows: AdminStatsPersonRow[];
      positionRows: AdminStatsPositionRow[];
    };

export function useAdminStatsWork(month: string): AdminStatsWorkController {
  const months = useMemo(() => [month], [month]);

  const work = useWorkMonthsQuery(supabase, months);

  const totals = useMemo(() => {
    const inputs = workInputsOf(monthIn(work.data, month)?.days ?? []);

    return computeWorkTotals(inputs.assignments, inputs.days);
  }, [work.data, month]);

  return fragmentOf(work, {
    empty: () => totals.totalCount === 0,
    ready: () => ({
      totalLabel: hoursLabel(totals.totalMinutes),
      countLine: `${STATS_COPY.workCountPrefix}${totals.totalCount}${STATS_COPY.workCountSuffix}`,
      peopleRows: totals.byPerson.map((row) => ({
        key: row.profileId,
        profileId: row.profileId,
        displayName: row.displayName,
        detail: `${row.count}${STATS_COPY.timesSuffix}`,
        value: hoursLabel(row.minutes),
        weight: row.minutes,
      })),
      positionRows: totals.byPosition.map((row): AdminStatsPositionRow => ({
        key: row.position,
        title: row.position,
        detail: `${row.count}${STATS_COPY.countSuffix}`,
        value: hoursLabel(row.minutes),
        weight: row.minutes,
        valueTone: row.minutes === 0 ? "zero" : "answer",
      })),
    }),
  });
}
