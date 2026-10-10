import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";
import type {
  AddSheetState,
  AddSheetValues,
} from "@/features/rehearsalEdit/model/addSheetState.reducer";
import type { RehearsalFormTarget } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";

export type RehearsalFormMode = RehearsalFormTarget["mode"];

export type RehearsalFormFaceInput = {
  mode: RehearsalFormMode;
  dateLabel: string;
  state: AddSheetState;
};

export type RehearsalFormFace = {
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

export type RehearsalFormSheetInput = {
  target: RehearsalFormTarget;
  dateLabel: string;
  onSaved: () => void;
};

export type RehearsalFormSheetController = RehearsalFormFace & {
  sending: boolean;
  change: (values: Partial<AddSheetValues>) => void;
  submit: () => void;
};
