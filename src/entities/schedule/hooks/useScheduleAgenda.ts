import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import {
  canShowShiftActions,
  rosterOfDay,
} from "@/entities/schedule/model/daySheet.policy";
import type {
  ScheduleAgendaController,
  ScheduleAgendaDay,
  ScheduleAgendaInput,
} from "@/entities/schedule/model/scheduleAgenda.type";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import {
  agendaRowStatusLabel,
  myAssignmentOf,
  spellWorkDate,
} from "@/entities/schedule/utils/agendaRow.utils";

export function useScheduleAgenda({
  month,
  myProfileId,
  showMineOnly,
  expanded,
  onToggle,
  onCancelShift,
  onRequestSwap,
}: ScheduleAgendaInput): ScheduleAgendaController {
  const { data, error, isLoading, refetch } = useMonthScheduleQuery(
    supabase,
    month,
  );

  if (isLoading) {
    return { state: "pending" };
  }

  if (error !== null) {
    return { state: "failed", retry: refetch };
  }

  const today = kstToday();

  const days: ScheduleAgendaDay[] = (data ?? [])
    .map((day) => ({
      day,
      myAssignment: myAssignmentOf(day.assignments, myProfileId),
    }))
    .filter((one) => !showMineOnly || one.myAssignment !== null)
    .map(({ day, myAssignment }, at) => ({
      workDate: day.workDate,
      title: spellWorkDate(day.workDate),
      statusLabel: agendaRowStatusLabel(myAssignment),
      statusTone:
        myAssignment === null ? ("subtle" as const) : ("brand" as const),
      expanded: expanded.includes(day.workDate),
      divider: at > 0,
      rows: rosterOfDay(day),
      showActions: canShowShiftActions({
        isMyAssignment: myAssignment !== null,
        workDate: day.workDate,
        today,
      }),
      toggle: () => onToggle(day.workDate),
      cancelShift: () => onCancelShift(day.workDate),
      requestSwap: () => onRequestSwap(day.workDate),
    }));

  return days.length === 0
    ? { state: "empty" }
    : { state: "ready", days, myProfileId };
}
