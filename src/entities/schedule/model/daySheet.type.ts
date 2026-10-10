import type { RosterRow } from "@/entities/schedule/model/daySheet.policy";

export type DaySheetInput = {
  workDate: string;
  myProfileId: string | null;
  cancelRequested: boolean;
  onCancelShift: () => void;
  onRequestSwap: () => void;
};

export type DaySheetController =
  | { state: "pending" }
  | { state: "failed"; retry: () => void }
  | {
      state: "ready";
      title: string;
      subtitle: string;
      rows: RosterRow[];
      myProfileId: string | null;
      myBadge: string | undefined;
      showActions: boolean;
      actionsEnabled: boolean;
      cancelShift: () => void;
      requestSwap: () => void;
    };
