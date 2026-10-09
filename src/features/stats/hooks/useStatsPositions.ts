import { useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { monthIn } from "@/shared/utils/monthIn";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
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
  | { state: "loading" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "ready"; totalLabel: string; rows: StatsPositionRow[] };

export function useStatsPositions(month: string): StatsPositionsController {
  const months = useMemo(() => [month], [month]);

  const { data: me } = useSessionUserQuery(supabase);
  const profile = useMyProfileRowQuery(supabase, me?.id ?? null);
  const work = useWorkMonthsQuery(supabase, months);

  const profileId = profile.data?.id ?? null;
  const shown = monthIn(work.data, month);

  const totals = useMemo(() => {
    if (profileId === null) {
      return { totalMinutes: 0, totalCount: 0, byPosition: [] };
    }

    const inputs = workInputsOf(shown?.days ?? []);

    return computeMyWorkTotals(inputs.assignments, inputs.days, profileId);
  }, [shown, profileId]);

  if (profile.isLoading || work.isLoading) {
    return { state: "loading" };
  }

  if (profile.error !== null || work.error !== null) {
    return { state: "failed" };
  }

  if (totals.totalCount === 0) {
    return { state: "empty" };
  }

  return {
    state: "ready",
    totalLabel: hoursLabel(totals.totalMinutes),
    rows: totals.byPosition.map((row) => ({
      key: row.position,
      title: row.position,
      detail: `${row.count}${STATS_COPY.countSuffix}`,
      value: hoursLabel(row.minutes),
      weight: row.minutes,
    })),
  };
}
