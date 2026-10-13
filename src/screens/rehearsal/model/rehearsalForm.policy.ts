import type {
  Rehearsal,
  RehearsalKind,
} from "@/entities/rehearsal/model/rehearsal.type";
import type { RehearsalFormTarget } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";
import type { RehearsalOpenForm } from "@/screens/rehearsal/model/rehearsalScreen.reducer";

export function formTargetOf(input: {
  openForm: RehearsalOpenForm | null;
  openDate: string | null;
  openKind: RehearsalKind;
  editing: Rehearsal | null;
}): RehearsalFormTarget | null {
  const { openForm, openDate, openKind, editing } = input;

  if (openForm === null || openDate === null) {
    return null;
  }

  if (openForm.mode === "add") {
    return { mode: "add", workDate: openDate, formKind: openKind };
  }

  if (editing === null) {
    return null;
  }

  return { mode: "edit", rehearsal: editing };
}
