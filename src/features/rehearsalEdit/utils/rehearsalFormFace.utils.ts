import { FORM_COPY } from "@/features/rehearsalEdit/consts/rehearsalEdit.const";
import { canSubmitForm } from "@/features/rehearsalEdit/model/addSheetState.reducer";
import type {
  RehearsalFormFace,
  RehearsalFormFaceInput,
} from "@/features/rehearsalEdit/model/rehearsalFormSheet.type";

export function rehearsalFormFace({
  mode,
  dateLabel,
  state,
}: RehearsalFormFaceInput): RehearsalFormFace {
  const { formKind, values, notice } = state;
  const adding = mode === "add";

  return {
    title: `${adding ? FORM_COPY.addTitle : FORM_COPY.editTitle} · ${dateLabel}`,
    formKind,
    values,
    wrongKindNotice: notice?.kind === "wrong_kind" ? notice.message : null,
    overlapsNotice: notice?.kind === "overlaps" ? notice.message : null,
    transportNotice:
      notice?.kind === "transport_error"
        ? `${notice.message}\n${notice.detail}`
        : null,
    guide: formKind === "time" ? FORM_COPY.timeGuide : FORM_COPY.countGuide,
    canSubmit: canSubmitForm(state),
    submitLabel: adding ? FORM_COPY.addSubmit : FORM_COPY.editSubmit,
  };
}
