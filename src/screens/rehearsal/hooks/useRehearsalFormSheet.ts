import { FORM_COPY } from "@/screens/rehearsal/consts/rehearsal.const";
import { canSubmitForm } from "@/screens/rehearsal/model/addSheetState.reducer";
import type {
  RehearsalFormSheetController,
  RehearsalFormSheetInput,
} from "@/screens/rehearsal/model/rehearsalFormSheet.type";

export function useRehearsalFormSheet({
  mode,
  dateLabel,
  state,
}: RehearsalFormSheetInput): RehearsalFormSheetController {
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
