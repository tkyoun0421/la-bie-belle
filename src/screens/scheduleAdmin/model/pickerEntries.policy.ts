import type {
  PickerEntry,
  PickerTarget,
} from "@/screens/scheduleAdmin/model/dayDetail.type";
import {
  classifyPickerRows,
  type PickerDayAssignment,
  type PickerRequestCandidate,
} from "@/screens/scheduleAdmin/model/personPickerRows.policy";

export type PickerEntryMember = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  gender: string | null;
};

export type PickerQualification = {
  profile_id: string;
  position: string;
};

export type PickerSlotRequest = {
  slot_id: string | null;
  request_candidates: readonly PickerRequestCandidate[];
};

export type PickerEntriesInput = {
  target: PickerTarget;
  members: readonly PickerEntryMember[];
  appliedProfileIds: readonly string[];
  qualifications: readonly PickerQualification[];
  dayAssignments: readonly PickerDayAssignment[];
  slotRequests: readonly PickerSlotRequest[];
  serverNowMs: number;
};

function requestFor(
  slotId: string | null,
  requests: readonly PickerSlotRequest[],
): PickerSlotRequest | null {
  if (slotId === null) {
    return null;
  }

  return requests.filter((one) => one.slot_id === slotId).at(-1) ?? null;
}

export function pickerEntries(input: PickerEntriesInput): PickerEntry[] {
  const { target } = input;
  const requestable = target.slotId !== null && target.replacing === null;
  const request = requestFor(target.slotId, input.slotRequests);

  const classified = classifyPickerRows({
    position: target.position,
    members: input.members.map((one) => ({
      profileId: one.id,
      displayName: one.display_name ?? "",
    })),
    appliedProfileIds: input.appliedProfileIds,
    qualifiedProfileIds: input.qualifications
      .filter((one) => one.position === target.position)
      .map((one) => one.profile_id),
    dayAssignments: input.dayAssignments,
    requestCandidates: request?.request_candidates ?? [],
    serverNowMs: input.serverNowMs,
  });

  return classified.map((row) => {
    const found = input.members.find((one) => one.id === row.profileId);

    return {
      ...row,
      checkbox: row.checkbox && requestable,
      photoUrl: found?.photo_url ?? null,
      gender: found?.gender ?? null,
    };
  });
}
