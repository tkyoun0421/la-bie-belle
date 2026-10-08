export type MergeTargetSlot = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type MergeTargetAssignment = {
  slot_id: string | null;
  kind: string;
  ended_at: string | null;
};

export type MergeTargetInput = {
  slots: readonly MergeTargetSlot[];
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
      slot.ended_at === null &&
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
          assignment.ended_at === null && assignment.kind === "regular",
      )
      .map((assignment) => assignment.slot_id),
  );

  return hasEmptySlot(input, input.fromPosition, taken) &&
    hasEmptySlot(input, input.toPosition, taken)
    ? "valid"
    : "no_empty_slot";
}
