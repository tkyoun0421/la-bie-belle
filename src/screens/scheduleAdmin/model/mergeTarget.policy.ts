import type {
  ScheduleAssignment,
  ScheduleSlot,
} from "@/entities/schedule/model/schedule.type";

export type MergeTargetAssignment = Pick<
  ScheduleAssignment,
  "slotId" | "kind" | "endedAt"
>;

export type MergeTargetInput = {
  slots: readonly ScheduleSlot[];
  assignments: readonly MergeTargetAssignment[];
  fromPosition: string;
  toPosition: string;
  fromUnlocked: boolean;
  toUnlocked: boolean;
};

export type MergeTargetValidity = "valid" | "locked" | "no_empty_slot";

function hasEmptySlot(
  input: MergeTargetInput,
  position: string,
  taken: ReadonlySet<string | null>,
): boolean {
  return input.slots.some(
    (slot) =>
      slot.endedAt === null &&
      slot.positions[0] === position &&
      !taken.has(slot.id),
  );
}

export function mergeTargetValidity(
  input: MergeTargetInput,
): MergeTargetValidity {
  if (!input.fromUnlocked || !input.toUnlocked) {
    return "locked";
  }

  const taken = new Set(
    input.assignments
      .filter(
        (assignment) =>
          assignment.endedAt === null && assignment.kind === "regular",
      )
      .map((assignment) => assignment.slotId),
  );

  return hasEmptySlot(input, input.fromPosition, taken) &&
    hasEmptySlot(input, input.toPosition, taken)
    ? "valid"
    : "no_empty_slot";
}
