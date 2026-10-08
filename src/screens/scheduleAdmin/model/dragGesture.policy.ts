import { discardSlotJudgement } from "@/screens/scheduleAdmin/model/discardSlot.policy";
import { mergeTargetValidity } from "@/screens/scheduleAdmin/model/mergeTarget.policy";
import {
  DISCARD_DROP_ID,
  positionOf,
  slotOf,
} from "@/screens/scheduleAdmin/utils/dragId.utils";
import { assignmentForSlot } from "@/screens/scheduleAdmin/utils/positionRows.utils";

export type DragGestureSlot = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type DragGestureAssignment = {
  id: string;
  slot_id: string | null;
  kind: string;
  ended_at: string | null;
  profile_id: string;
};

export type CanDropInput = {
  dragId: string;
  dropId: string;
  slots: readonly DragGestureSlot[];
  assignments: readonly DragGestureAssignment[];
  unlockedPositions: readonly string[];
};

export type DropOutcomeInput = {
  dragId: string;
  dropId: string;
  assignments: readonly DragGestureAssignment[];
};

export type DropOutcome =
  | { kind: "merge"; fromPosition: string; toPosition: string }
  | { kind: "remove"; slotId: string }
  | { kind: "confirm"; slotId: string; profileId: string }
  | { kind: "none" };

export function canDropOnTarget(input: CanDropInput): boolean {
  if (slotOf(input.dragId) !== null) {
    return input.dropId === DISCARD_DROP_ID;
  }

  const from = positionOf(input.dragId);
  const to = positionOf(input.dropId);

  if (from === null || to === null) {
    return false;
  }

  return (
    mergeTargetValidity({
      slots: input.slots,
      assignments: input.assignments,
      fromPosition: from,
      toPosition: to,
      fromUnlocked: input.unlockedPositions.includes(from),
      toUnlocked: input.unlockedPositions.includes(to),
    }) === "valid"
  );
}

export function dropOutcome(input: DropOutcomeInput): DropOutcome {
  const fromPosition = positionOf(input.dragId);
  const toPosition = positionOf(input.dropId);

  if (fromPosition !== null && toPosition !== null) {
    return { kind: "merge", fromPosition, toPosition };
  }

  const slotId = slotOf(input.dragId);

  if (slotId === null) {
    return { kind: "none" };
  }

  const taken = assignmentForSlot(slotId, input.assignments);

  if (
    taken !== null &&
    discardSlotJudgement([taken]) === "needs_confirmation"
  ) {
    return { kind: "confirm", slotId, profileId: taken.profile_id };
  }

  return { kind: "remove", slotId };
}
