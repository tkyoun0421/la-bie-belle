import { isProfileGender } from "@/entities/profile/model/profile.schema";
import { SCHEDULE_ADMIN_SHEET_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { PickerEntry } from "@/screens/scheduleAdmin/model/dayDetail.type";
import type {
  PersonPickerLineView,
  PersonPickerSheetController,
  PersonPickerSheetInput,
} from "@/screens/scheduleAdmin/model/personPickerSheet.type";
import { genderSymbol } from "@/screens/scheduleAdmin/utils/personSheet.utils";

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
        : `${picked.length}${SCHEDULE_ADMIN_SHEET_COPY.sendRequestSuffix}`,
  };
}
