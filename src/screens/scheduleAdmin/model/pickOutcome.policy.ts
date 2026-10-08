import type {
  PendingChange,
  PickerTarget,
} from "@/screens/scheduleAdmin/model/dayDetail.type";
import type { PickerCategory } from "@/screens/scheduleAdmin/model/personPickerRows.policy";

export type PickedEntry = {
  profileId: string;
  displayName: string;
  category: PickerCategory;
  checkbox: boolean;
};

export type PickOutcome =
  | { kind: "toggle_request"; profileId: string }
  | { kind: "ignore" }
  | { kind: "merge_instead" }
  | { kind: "needs_qualification" }
  | { kind: "change"; change: PendingChange };

export function pickOutcome(
  target: PickerTarget,
  entry: PickedEntry,
): PickOutcome {
  if (entry.checkbox) {
    return { kind: "toggle_request", profileId: entry.profileId };
  }

  if (entry.category === "not_applied") {
    return { kind: "ignore" };
  }

  if (entry.category === "assigned") {
    return { kind: "merge_instead" };
  }

  if (entry.category === "not_qualified") {
    return { kind: "needs_qualification" };
  }

  if (target.replacing !== null) {
    return {
      kind: "change",
      change: {
        kind: "swap",
        assignmentId: target.replacing.assignmentId,
        profileId: entry.profileId,
        outgoingProfileId: target.replacing.outgoingProfileId,
        outgoingName: target.replacing.outgoingName,
        incomingName: entry.displayName,
      },
    };
  }

  if (target.slotId === null) {
    return {
      kind: "change",
      change: {
        kind: "training",
        position: target.position,
        profileId: entry.profileId,
        name: entry.displayName,
      },
    };
  }

  return {
    kind: "change",
    change: {
      kind: "add",
      slotId: target.slotId,
      profileId: entry.profileId,
      name: entry.displayName,
      skipQualification: false,
      grant: null,
    },
  };
}
