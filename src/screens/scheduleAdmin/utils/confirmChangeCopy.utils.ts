import type { PendingChange } from "@/screens/scheduleAdmin/model/dayDetail.type";
import type { ForceChangeCopyInput } from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";

export function confirmChangeCopyOf(
  change: PendingChange,
  canNotify: (profileId: string) => boolean,
): ForceChangeCopyInput {
  if (change.kind === "swap") {
    return {
      kind: "swap",
      outgoingName: change.outgoingName,
      outgoingCanNotify: canNotify(change.outgoingProfileId),
      incomingName: change.incomingName,
      incomingCanNotify: canNotify(change.profileId),
    };
  }

  if (change.kind === "remove") {
    return {
      kind: "remove",
      outgoingName: change.outgoingName,
      outgoingCanNotify: canNotify(change.outgoingProfileId),
    };
  }

  return {
    kind: change.kind,
    incomingName: change.name,
    incomingCanNotify: canNotify(change.profileId),
  };
}
