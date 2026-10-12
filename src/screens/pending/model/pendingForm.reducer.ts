import { PROFILE_FORM_STEPS } from "@/features/profileEdit/consts/profileEdit.const";
import type { ProfileFormStep } from "@/features/profileEdit/model/profileFormStep.type";
import type { PendingFormValues } from "@/screens/pending/model/pendingForm.type";

export type PendingFormState =
  | { kind: "unseeded" }
  | {
      kind: "seeded";
      values: PendingFormValues;
      frozen: ProfileFormStep[];
      everSubmitted: boolean;
    };

export type PendingFormAction =
  | { type: "seed"; values: PendingFormValues; answered: boolean }
  | { type: "write"; values: Partial<PendingFormValues> }
  | { type: "freeze"; step: ProfileFormStep }
  | { type: "thaw"; step: ProfileFormStep }
  | { type: "submitted" };

export function pendingFormReducer(
  state: PendingFormState,
  action: PendingFormAction,
): PendingFormState {
  if (action.type === "seed") {
    return state.kind === "seeded"
      ? state
      : {
          kind: "seeded",
          values: action.values,
          frozen: action.answered ? [...PROFILE_FORM_STEPS] : [],
          everSubmitted: action.answered,
        };
  }

  if (state.kind === "unseeded") {
    return state;
  }

  switch (action.type) {
    case "write":
      return { ...state, values: { ...state.values, ...action.values } };
    case "freeze":
      return state.frozen.includes(action.step)
        ? state
        : { ...state, frozen: [...state.frozen, action.step] };
    case "thaw":
      return {
        ...state,
        frozen: state.frozen.filter((one) => one !== action.step),
      };
    case "submitted":
      return { ...state, everSubmitted: true };
  }
}
