import type {
  PickerEntry,
  PickerTarget,
} from "@/features/scheduleAssign/model/pickerEntry.type";
import { CLOSED_DAY_DETAIL_PICKER } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";

export type DayDetailPickerState =
  | { kind: "closed" }
  | {
      kind: "picking";
      target: PickerTarget;
      expanded: boolean;
      picked: readonly string[];
      inspecting: PickerEntry | null;
      qualifying: PickerEntry | null;
    };

export type DayDetailPickerAction =
  | { type: "open"; target: PickerTarget }
  | { type: "expand" }
  | { type: "toggle"; profileId: string }
  | { type: "inspect"; entry: PickerEntry }
  | { type: "stop_inspecting" }
  | { type: "qualify"; entry: PickerEntry }
  | { type: "stop_qualifying" }
  | { type: "close" };

function toggled(picked: readonly string[], profileId: string): string[] {
  return picked.includes(profileId)
    ? picked.filter((one) => one !== profileId)
    : [...picked, profileId];
}

export function dayDetailPickerReducer(
  state: DayDetailPickerState,
  action: DayDetailPickerAction,
): DayDetailPickerState {
  if (action.type === "open") {
    return state.kind === "closed"
      ? {
          kind: "picking",
          target: action.target,
          expanded: false,
          picked: [],
          inspecting: null,
          qualifying: null,
        }
      : { ...state, target: action.target, expanded: false };
  }

  if (action.type === "close" || state.kind === "closed") {
    return CLOSED_DAY_DETAIL_PICKER;
  }

  switch (action.type) {
    case "expand":
      return { ...state, expanded: true };
    case "toggle":
      return { ...state, picked: toggled(state.picked, action.profileId) };
    case "inspect":
      return { ...state, inspecting: action.entry };
    case "stop_inspecting":
      return { ...state, inspecting: null };
    case "qualify":
      return { ...state, qualifying: action.entry };
    case "stop_qualifying":
      return { ...state, qualifying: null };
  }
}
