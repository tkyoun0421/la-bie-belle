/**
 * 줄 머리를 다른 줄 머리에 겹쳤을 때 합침이 유효한지를 데이터로만 판정한다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「잠금과 구조 변경」이다.
 *
 * **좌표는 안 본다.** 어디에 겹쳤는지는 끌기 조각이 알고, 겹친 뒤에 받을지 말지는 여기가
 * 정한다 — 그래야 대상 줄 머리에 테두리를 세울지도 `merge_slots`가 던질 `no_empty_slot`도
 * 한 규칙에서 나온다.
 */

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
