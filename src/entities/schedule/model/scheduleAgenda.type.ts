import type { TextTone } from "@/shared/ui/Text";
import type { RosterRow } from "@/entities/schedule/model/daySheet.policy";

export type ScheduleAgendaInput = {
  month: string;
  myProfileId: string | null;
  showMineOnly: boolean;
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

export type ScheduleAgendaController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | { state: "empty" }
  | {
      state: "ready";
      days: ScheduleAgendaDay[];
      myProfileId: string | null;
    };
