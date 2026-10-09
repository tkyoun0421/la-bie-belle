import type { PickerRow } from "@/features/scheduleAssign/model/personPickerRows.policy";

export type PickerEntry = PickerRow & {
  photoUrl: string | null;
  gender: string | null;
};

export type PickerTarget = {
  position: string;
  slotId: string | null;
  replacing: {
    assignmentId: string;
    outgoingProfileId: string;
    outgoingName: string;
  } | null;
};
