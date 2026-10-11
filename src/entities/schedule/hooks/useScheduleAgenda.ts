import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import {
  canShowShiftActions,
  rosterOfDay,
} from "@/entities/schedule/model/daySheet.policy";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
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

function agendaDaysOf(
  days: readonly ScheduleDay[],
  {
    myProfileId,
    showMineOnly,
    expanded,
    onToggle,
    onCancelShift,
    onRequestSwap,
  }: ScheduleAgendaInput,
): ScheduleAgendaDay[] {
  const today = kstToday();

  return days
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
}

export function useScheduleAgenda(
  input: ScheduleAgendaInput,
): ScheduleAgendaController {
  const read = useMonthScheduleQuery(supabase, input.month);

  return fragmentOf(read, {
    empty: (days) => agendaDaysOf(days, input).length === 0,
    failed: () => ({ retry: read.refetch }),
    ready: (days) => ({
      days: agendaDaysOf(days, input),
      myProfileId: input.myProfileId,
    }),
  });
}
