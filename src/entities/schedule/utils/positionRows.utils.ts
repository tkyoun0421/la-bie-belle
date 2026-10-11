import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
import type {
  ScheduleAssignment,
  ScheduleSlot,
} from "@/entities/schedule/model/schedule.type";

export type PositionAssignment = Pick<
  ScheduleAssignment,
  "id" | "slotId" | "kind" | "endedAt"
>;

export type SlotFill = {
  filled: number;
  total: number;
};

function isLiveRegular(assignment: PositionAssignment): boolean {
  return assignment.endedAt === null && assignment.kind === "regular";
}

function isLive(slot: ScheduleSlot): boolean {
  return slot.endedAt === null;
}

export function groupSlotsByPosition(
  slots: readonly ScheduleSlot[],
): Record<string, ScheduleSlot[]> {
  const live = slots.filter(isLive);

  return Object.fromEntries(
    POSITION_ORDER.map((position): [string, ScheduleSlot[]] => [
      position,
      live.filter((slot) => slot.positions[0] === position),
    ]),
  );
}

export function slotFillCount(
  slots: readonly ScheduleSlot[],
  assignments: readonly PositionAssignment[],
): SlotFill {
  const live = slots.filter(isLive);
  const taken = new Set(
    assignments.filter(isLiveRegular).map((assignment) => assignment.slotId),
  );

  return {
    filled: live.filter((slot) => taken.has(slot.id)).length,
    total: live.length,
  };
}

export function assignmentForSlot<Assignment extends PositionAssignment>(
  slotId: string,
  assignments: readonly Assignment[],
): Assignment | null {
  return (
    assignments.find(
      (assignment) => isLiveRegular(assignment) && assignment.slotId === slotId,
    ) ?? null
  );
}
