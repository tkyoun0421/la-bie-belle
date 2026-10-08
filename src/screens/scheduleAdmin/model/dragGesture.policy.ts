import type {
  ScheduleAssignment,
  ScheduleSlot,
} from "@/entities/schedule/model/schedule.type";
import { DISCARD_DROP_ID } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import { discardSlotJudgement } from "@/screens/scheduleAdmin/model/discardSlot.policy";
import { mergeTargetValidity } from "@/screens/scheduleAdmin/model/mergeTarget.policy";
import { positionOf, slotOf } from "@/screens/scheduleAdmin/utils/dragId.utils";
import { assignmentForSlot } from "@/screens/scheduleAdmin/utils/positionRows.utils";

export type DragGestureAssignment = Pick<
  ScheduleAssignment,
  "id" | "slotId" | "kind" | "endedAt" | "profileId"
>;

export type CanDropInput = {
  dragId: string;
  dropId: string;
  slots: readonly ScheduleSlot[];
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
    return { kind: "confirm", slotId, profileId: taken.profileId };
  }

  return { kind: "remove", slotId };
}
