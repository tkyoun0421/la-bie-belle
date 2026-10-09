import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";
import type {
  AddSheetState,
  AddSheetValues,
} from "@/screens/rehearsal/model/addSheetState.reducer";

export type RehearsalFormMode = "add" | "edit";

export type RehearsalFormSheetInput = {
  mode: RehearsalFormMode;
  dateLabel: string;
  state: AddSheetState;
};

export type RehearsalFormSheetController = {
  title: string;
  formKind: RehearsalKind;
  values: AddSheetValues;
  wrongKindNotice: string | null;
  overlapsNotice: string | null;
  transportNotice: string | null;
  guide: string;
  canSubmit: boolean;
  submitLabel: string;
};
