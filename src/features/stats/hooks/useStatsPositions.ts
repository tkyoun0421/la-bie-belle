import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { monthIn } from "@/shared/utils/monthIn";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { STATS_COPY } from "@/features/stats/consts/stats.const";
import {
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";
import { computeMyWorkTotals } from "@/features/stats/utils/myTotals.utils";

export type StatsPositionRow = {
  key: string;
  title: string;
  detail: string;
  value: string;
  weight: number;
};

export type StatsPositionsController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "ready"; totalLabel: string; rows: StatsPositionRow[] };

export function useStatsPositions(
  month: string,
  profileId: string,
): StatsPositionsController {
  const months = useMemo(() => [month], [month]);

  const work = useWorkMonthsQuery(supabase, months);

  const shown = monthIn(work.data, month);

  const totals = useMemo(() => {
    const inputs = workInputsOf(shown?.days ?? []);

    return computeMyWorkTotals(inputs.assignments, inputs.days, profileId);
  }, [shown, profileId]);

  return fragmentOf(work, {
    empty: () => totals.totalCount === 0,
    ready: () => ({
      totalLabel: hoursLabel(totals.totalMinutes),
      rows: totals.byPosition.map((row) => ({
        key: row.position,
        title: row.position,
        detail: `${row.count}${STATS_COPY.countSuffix}`,
        value: hoursLabel(row.minutes),
        weight: row.minutes,
      })),
    }),
  });
}
