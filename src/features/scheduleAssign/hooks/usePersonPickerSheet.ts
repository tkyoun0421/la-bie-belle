import { isProfileGender } from "@/entities/profile/model/profile.schema";
import { SCHEDULE_ASSIGN_COPY } from "@/features/scheduleAssign/consts/scheduleAssign.const";
import type {
  PersonPickerLineView,
  PersonPickerSheetController,
  PersonPickerSheetInput,
} from "@/features/scheduleAssign/model/personPickerSheet.type";
import type { PickerEntry } from "@/features/scheduleAssign/model/pickerEntry.type";
import { genderSymbol } from "@/features/scheduleAssign/utils/personSheet.utils";

export function usePersonPickerSheet({
  entries,
  expanded,
  picked,
  onPick,
  onInspect,
  onToggle,
}: PersonPickerSheetInput): PersonPickerSheetController {
  const lineOf = (entry: PickerEntry): PersonPickerLineView => {
    const dimmed = entry.category === "assigned";
    const known = isProfileGender(entry.gender) ? entry.gender : null;

    return {
      profileId: entry.profileId,
      displayName: entry.displayName,
      photoUrl: entry.photoUrl,
      nameTone: dimmed ? "disabled" : "neutral",
      genderIcon: known === null ? null : genderSymbol(known),
      genderTone: dimmed ? "disabled" : "subtle",
      message: entry.message,
      showCheckbox: entry.checkbox,
      checked: picked.includes(entry.profileId),
      press: () => onPick(entry),
      inspect: () => onInspect(entry),
      toggle: () => onToggle(entry.profileId),
    };
  };

  return {
    assignable: entries
      .filter((entry) => entry.category === "assignable")
      .map(lineOf),
    rest: entries
      .filter((entry) => entry.category !== "assignable")
      .map(lineOf),
    showRest: expanded,
    sendLabel:
      picked.length === 0
        ? null
        : `${picked.length}${SCHEDULE_ASSIGN_COPY.sendRequestSuffix}`,
  };
}
