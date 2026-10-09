import { useEffect, useReducer } from "react";
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

  const {
    mutate: add,
    isPending: adding,
    isSuccess: added,
    isError: addFailed,
    error: addError,
    reset: resetAdd,
  } = useAddRehearsalMutation(supabase);

  const {
    mutate: save,
    isPending: savingEdit,
    isSuccess: saved,
    isError: editFailed,
    error: editError,
    reset: resetEdit,
  } = useEditRehearsalMutation(supabase);

  useEffect(() => {
    if (added || saved) {
      onSaved();
    }
  }, [added, saved, onSaved]);

  useEffect(() => {
    if (!addFailed) {
      return;
    }

    dispatch(addSheetActionFor(addError, state.formKind));
    resetAdd();
  }, [addFailed, addError, state.formKind, resetAdd]);

  useEffect(() => {
    if (!editFailed) {
      return;
    }

    dispatch(addSheetActionFor(editError, state.formKind));
    resetEdit();
  }, [editFailed, editError, state.formKind, resetEdit]);

  return {
    ...rehearsalFormFace({ mode: target.mode, dateLabel, state }),
    saving: adding || savingEdit,
    change: (values) => dispatch({ type: "change", values }),
    submit: () => {
      if (!canSubmitForm(state)) {
        return;
      }

      const written =
        state.formKind === "count"
          ? { count: Number(state.values.count) }
          : { startsAt: state.values.startsAt, endsAt: state.values.endsAt };

      if (target.mode === "edit") {
        save({ id: target.rehearsal.id, ...written });
        return;
      }

      add({ workDate: target.workDate, ...written });
    },
  };
}
