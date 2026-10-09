import type {
  Member,
  Qualification,
} from "@/entities/member/model/member.type";
import type {
  PickerEntry,
  PickerTarget,
} from "@/screens/scheduleAdmin/model/dayDetail.type";
import {
  classifyPickerRows,
  type PickerDayAssignment,
  type PickerRequestCandidate,
} from "@/screens/scheduleAdmin/model/personPickerRows.policy";

export type PickerEntryMember = Pick<
  Member,
  "id" | "displayName" | "photoUrl" | "gender"
>;

export type PickerSlotRequest = {
  slotId: string | null;
  candidates: readonly PickerRequestCandidate[];
};

export type PickerEntriesInput = {
  target: PickerTarget;
  members: readonly PickerEntryMember[];
  appliedProfileIds: readonly string[];
  qualifications: readonly Qualification[];
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

  return requests.filter((one) => one.slotId === slotId).at(-1) ?? null;
}

export function pickerEntries(input: PickerEntriesInput): PickerEntry[] {
  const { target } = input;
  const requestable = target.slotId !== null && target.replacing === null;
  const request = requestFor(target.slotId, input.slotRequests);

  const classified = classifyPickerRows({
    position: target.position,
    members: input.members.map((one) => ({
      profileId: one.id,
      displayName: one.displayName ?? "",
    })),
    appliedProfileIds: input.appliedProfileIds,
    qualifiedProfileIds: input.qualifications
      .filter((one) => one.position === target.position)
      .map((one) => one.profileId),
    dayAssignments: input.dayAssignments,
    requestCandidates: request?.candidates ?? [],
    serverNowMs: input.serverNowMs,
  });

  return classified.map((row) => {
    const found = input.members.find((one) => one.id === row.profileId);

    return {
      ...row,
      checkbox: row.checkbox && requestable,
      photoUrl: found?.photoUrl ?? null,
      gender: found?.gender ?? null,
    };
  });
}
