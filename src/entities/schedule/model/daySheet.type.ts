import type { RosterRow } from "@/entities/schedule/model/daySheet.policy";

export type DaySheetState = "loading" | "failed" | "ready";

export type DaySheetInput = {
  workDate: string;
  myProfileId: string | null;
  cancelRequested: boolean;
  onCancelShift: () => void;
  onRequestSwap: () => void;
};

export type DaySheetController = {
  state: DaySheetState;
  title: string;
  subtitle: string;
  rows: RosterRow[];
  myProfileId: string | null;
  myBadge: string | undefined;
  showActions: boolean;
  actionsEnabled: boolean;
  retry: () => void;
  cancelShift: () => void;
  requestSwap: () => void;
};
