import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

export type PositionSlot = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type PositionAssignment = {
  id: string;
  slot_id: string | null;
  kind: string;
  ended_at: string | null;
};

export type SlotFill = {
  filled: number;
  total: number;
};

function isLiveRegular(assignment: PositionAssignment): boolean {
  return assignment.ended_at === null && assignment.kind === "regular";
}

function isLive(slot: PositionSlot): boolean {
  return slot.ended_at === null;
}

export function groupSlotsByPosition(
  slots: readonly PositionSlot[],
): Record<string, PositionSlot[]> {
  const groups: Record<string, PositionSlot[]> = {};

  for (const position of POSITION_ORDER) {
    groups[position] = [];
  }

  for (const slot of slots.filter(isLive)) {
    groups[slot.positions[0]]?.push(slot);
  }

  return groups;
}

export function slotFillCount(
  slots: readonly PositionSlot[],
  assignments: readonly PositionAssignment[],
): SlotFill {
  const live = slots.filter(isLive);
  const taken = new Set(
    assignments.filter(isLiveRegular).map((assignment) => assignment.slot_id),
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
      (assignment) =>
        isLiveRegular(assignment) && assignment.slot_id === slotId,
    ) ?? null
  );
}
