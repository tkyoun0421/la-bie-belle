import type { TextTone } from "@/shared/ui/Text";
import type { RosterRow } from "@/screens/scheduleWorker/model/daySheet.policy";
import type { MyAssignment } from "@/screens/scheduleWorker/utils/agendaRow.utils";

export type AgendaEntry = {
  workDate: string;
  myAssignment: MyAssignment | null;
  rows: RosterRow[];
  showActions: boolean;
};

export type ScheduleAgendaInput = {
  entries: AgendaEntry[];
  expanded: string[];
  onToggle: (workDate: string) => void;
  onCancelShift: (workDate: string) => void;
  onRequestSwap: (workDate: string) => void;
};

export type ScheduleAgendaDay = {
  workDate: string;
  title: string;
  statusLabel: string;
  statusTone: TextTone;
  expanded: boolean;
  divider: boolean;
  rows: RosterRow[];
  showActions: boolean;
  toggle: () => void;
  cancelShift: () => void;
  requestSwap: () => void;
};

export type ScheduleAgendaController = {
  empty: boolean;
  days: ScheduleAgendaDay[];
};
