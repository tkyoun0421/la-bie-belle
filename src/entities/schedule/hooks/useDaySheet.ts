import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { cancelRequestBadge } from "@/entities/schedule/model/cancelRequestSheet.policy";
import {
  canShowShiftActions,
  daySheetSubtitle,
  rosterHeadcount,
  rosterOfDay,
} from "@/entities/schedule/model/daySheet.policy";
import type {
  DaySheetController,
  DaySheetInput,
} from "@/entities/schedule/model/daySheet.type";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import {
  myAssignmentOf,
  spellWorkDate,
} from "@/entities/schedule/utils/agendaRow.utils";

function monthOf(workDate: string): string {
  return workDate.slice(0, 7);
}

export function useDaySheet({
  workDate,
  myProfileId,
  cancelRequested,
  onCancelShift,
  onRequestSwap,
}: DaySheetInput): DaySheetController {
  const { data, error, isLoading, refetch } = useMonthScheduleQuery(
    supabase,
    monthOf(workDate),
  );

  if (isLoading) {
    return { state: "pending" };
  }

  const day = (data ?? []).find((one) => one.workDate === workDate) ?? null;

  if (error !== null || day === null) {
    return { state: "failed", retry: refetch };
  }

  const rows = rosterOfDay(day);
  const isMyAssignment = myAssignmentOf(day.assignments, myProfileId) !== null;
  const today = kstToday();

  return {
    state: "ready",
    title: spellWorkDate(workDate),
    subtitle: daySheetSubtitle(day.startsAt, day.endsAt, rosterHeadcount(rows)),
    rows,
    myProfileId,
    myBadge: cancelRequestBadge(cancelRequested) ?? undefined,
    showActions: canShowShiftActions({ isMyAssignment, workDate, today }),
    actionsEnabled: canShowShiftActions({
      isMyAssignment,
      workDate,
      today,
      hasActiveCancelRequest: cancelRequested,
    }),
    cancelShift: onCancelShift,
    requestSwap: onRequestSwap,
  };
}
