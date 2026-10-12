import { useReducer } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  addSheetActionFor,
  addSheetReducer,
  canSubmitForm,
} from "@/features/rehearsalEdit/model/addSheetState.reducer";
import type {
  RehearsalFormSheetController,
  RehearsalFormSheetInput,
} from "@/features/rehearsalEdit/model/rehearsalFormSheet.type";
import { openedAddSheet } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";
import { useAddRehearsalMutation } from "@/features/rehearsalEdit/services/useAddRehearsalMutation";
import { useEditRehearsalMutation } from "@/features/rehearsalEdit/services/useEditRehearsalMutation";
import { rehearsalFormFace } from "@/features/rehearsalEdit/utils/rehearsalFormFace.utils";

export function useRehearsalFormSheet({
  target,
  dateLabel,
  onSaved,
}: RehearsalFormSheetInput): RehearsalFormSheetController {
  const [state, dispatch] = useReducer(addSheetReducer, target, openedAddSheet);

  const { mutate: add, isPending: adding } = useAddRehearsalMutation(supabase);

  const { mutate: save, isPending: savingEdit } =
    useEditRehearsalMutation(supabase);

  return {
    ...rehearsalFormFace({ mode: target.mode, dateLabel, state }),
    sending: adding || savingEdit,
    change: (values) => dispatch({ type: "change", values }),
    submit: () => {
      if (!canSubmitForm(state)) {
        return;
      }

      const written =
        state.formKind === "count"
          ? { count: Number(state.values.count) }
          : { startsAt: state.values.startsAt, endsAt: state.values.endsAt };

      const settled = {
        onSuccess: onSaved,
        onError: (error: Error) =>
          dispatch(addSheetActionFor(error, state.formKind)),
      };

      if (target.mode === "edit") {
        save({ id: target.rehearsal.id, ...written }, settled);
        return;
      }

      add({ workDate: target.workDate, ...written }, settled);
    },
  };
}
