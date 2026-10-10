import { supabase } from "@/shared/api/supabase";
import { spellDate } from "@/shared/utils/kstDate";
import { canAddOn } from "@/entities/rehearsal/model/canAddOn.policy";
import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/services/useAllRehearsalsQuery";
import { useMyRehearsalsQuery } from "@/entities/rehearsal/services/useMyRehearsalsQuery";
import {
  daySheetRows,
  type DaySheetContent,
} from "@/entities/rehearsal/utils/daySheetRows.utils";

export type RehearsalDaySheetInput = {
  workDate: string;
  month: string;
  isAdmin: boolean;
  formKind: RehearsalKind;
};

export type RehearsalDaySheetController =
  | { state: "pending" }
  | { state: "failed" }
  | {
      state: "ready";
      title: string;
      content: DaySheetContent;
      canAdd: boolean;
    };

export function useRehearsalDaySheet({
  workDate,
  month,
  isAdmin,
  formKind,
}: RehearsalDaySheetInput): RehearsalDaySheetController {
  const mine = useMyRehearsalsQuery(supabase, month, !isAdmin);
  const all = useAllRehearsalsQuery(supabase, month, isAdmin);

  const asked = isAdmin ? all : mine;
  const rows = (asked.data ?? []).filter((row) => row.workDate === workDate);

  if (asked.error !== null) {
    return { state: "failed" };
  }

  if (asked.data === undefined) {
    return { state: "pending" };
  }

  return {
    state: "ready",
    title: spellDate(workDate),
    content: daySheetRows(rows, isAdmin),
    canAdd: !isAdmin && canAddOn(formKind, rows),
  };
}
