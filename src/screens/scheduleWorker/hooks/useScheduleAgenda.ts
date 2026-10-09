import type {
  ScheduleAgendaController,
  ScheduleAgendaInput,
} from "@/screens/scheduleWorker/model/scheduleAgenda.type";
import {
  agendaRowStatusLabel,
  spellWorkDate,
} from "@/screens/scheduleWorker/utils/agendaRow.utils";

export function useScheduleAgenda({
  entries,
  expanded,
  onToggle,
  onCancelShift,
  onRequestSwap,
}: ScheduleAgendaInput): ScheduleAgendaController {
  return {
    empty: entries.length === 0,
    days: entries.map((entry, at) => ({
      workDate: entry.workDate,
      title: spellWorkDate(entry.workDate),
      statusLabel: agendaRowStatusLabel(entry.myAssignment),
      statusTone: entry.myAssignment === null ? "subtle" : "brand",
      expanded: expanded.includes(entry.workDate),
      divider: at > 0,
      rows: entry.rows,
      showActions: entry.showActions,
      toggle: () => onToggle(entry.workDate),
      cancelShift: () => onCancelShift(entry.workDate),
      requestSwap: () => onRequestSwap(entry.workDate),
    })),
  };
}
