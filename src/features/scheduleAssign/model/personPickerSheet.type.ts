import type { PersonSheetGenderIcon } from "@/features/scheduleAssign/model/personSheet.type";
import type { PickerEntry } from "@/features/scheduleAssign/model/pickerEntry.type";

export type PersonPickerSheetInput = {
  entries: readonly PickerEntry[];
  expanded: boolean;
  picked: readonly string[];
  onPick: (entry: PickerEntry) => void;
  onInspect: (entry: PickerEntry) => void;
  onToggle: (profileId: string) => void;
};

export type PersonPickerLineView = {
  profileId: string;
  displayName: string;
  photoUrl: string | null;
  nameTone: "disabled" | "neutral";
  genderIcon: PersonSheetGenderIcon | null;
  genderTone: "disabled" | "subtle";
  message: string | null;
  showCheckbox: boolean;
  checked: boolean;
  press: () => void;
  inspect: () => void;
  toggle: () => void;
};

export type PersonPickerSheetController = {
  assignable: readonly PersonPickerLineView[];
  rest: readonly PersonPickerLineView[];
  showRest: boolean;
  sendLabel: string | null;
};
