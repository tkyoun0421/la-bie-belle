import type { OpenSlot } from "@/entities/schedule/model/schedule.type";

export type ConfirmSheetInput = {
  month: string;
  openSlots: readonly OpenSlot[];
  notifiedCount: number;
  done: boolean;
  failed: boolean;
  onClose: () => void;
};

export type ConfirmSheetFace = "done" | "failed" | "ask";

export type ConfirmSheetVacancy = {
  headLine: string;
  itemLines: readonly string[];
  overflowLine: string | null;
};

export type ConfirmSheetController = {
  face: ConfirmSheetFace;
  doneTitle: string;
  doneNote: string;
  askTitle: string;
  askButtonLabel: string;
  vacancy: ConfirmSheetVacancy | null;
};
