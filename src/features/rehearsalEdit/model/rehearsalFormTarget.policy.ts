import { clockOf } from "@/shared/utils/kstDate";
import type {
  Rehearsal,
  RehearsalKind,
} from "@/entities/rehearsal/model/rehearsal.type";
import { EMPTY_ADD_SHEET_VALUES } from "@/features/rehearsalEdit/consts/rehearsalEdit.const";
import type { AddSheetState } from "@/features/rehearsalEdit/model/addSheetState.reducer";

export type RehearsalFormTarget =
  | { mode: "add"; workDate: string; formKind: RehearsalKind }
  | { mode: "edit"; rehearsal: Rehearsal };

export function openedAddSheet(target: RehearsalFormTarget): AddSheetState {
  if (target.mode === "add") {
    return {
      formKind: target.formKind,
      values: { ...EMPTY_ADD_SHEET_VALUES },
      notice: null,
    };
  }

  const { startsAt, endsAt, count } = target.rehearsal;

  return {
    formKind: count === null ? "time" : "count",
    values: {
      startsAt: clockOf(startsAt ?? ""),
      endsAt: clockOf(endsAt ?? ""),
      count: count === null ? "" : String(count),
    },
    notice: null,
  };
}
