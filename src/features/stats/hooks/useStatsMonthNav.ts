import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { spellMonth } from "@/shared/utils/kstDate";
import {
  canGoToNextMonth,
  canGoToPreviousMonth,
} from "@/shared/utils/monthBoundary";
import { useFirstScheduleMonthQuery } from "@/entities/schedule/services/useFirstScheduleMonthQuery";

export type StatsMonthNavController = {
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
};

export function useStatsMonthNav(month: string): StatsMonthNavController {
  const firstMonth = useFirstScheduleMonthQuery(supabase);
  const today = kstToday();

  return {
    label: spellMonth(month),
    canGoPrev:
      firstMonth.data != null && canGoToPreviousMonth(month, firstMonth.data),
    canGoNext: canGoToNextMonth(month, today),
  };
}
