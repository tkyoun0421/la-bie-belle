/**
 * 날 상세의 포지션 아홉 줄이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「포지션과 자리」고 순서는
 * `docs/2-design/modules/schedule/README.md`의 SCH-011이다.
 *
 * **겸임 자리는 받은 쪽 줄에만 선다.** `positions[0]`이 받은 쪽이다(SQL의 `positions[1]`).
 * 양쪽에 그리면 자리 하나가 둘로 보이고, 내준 쪽 줄에서는 분모가 그만큼 준다 — 화면이 따로
 * 세지 않고 배열 모양에서 바로 나온다.
 *
 * **셈의 분자는 살아 있는 정규 배정이 있는 자리 수다.** 교육 배정은 자리를 안 먹어 안 든다
 * (SCH-012).
 *
 * 아홉과 그 순서는 업무 상수라
 * [`entities/schedule/model/positions.ts`](../../../entities/schedule/model/positions.ts)가
 * 들고, 이 파일은 부르던 이름을 그대로 두려고 다시 내보낸다.
 */

import {
  POSITION_ORDER,
  type Position,
} from "@/entities/schedule/model/schedule.type";

export { POSITION_ORDER, type Position };

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

/** 자리가 하나도 없는 포지션도 줄이 선다 — 셈이 「0/0」으로 보여야 자리를 더할 데를 안다. */
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

/**
 * 같은 포지션 자리가 여럿일 때 누가 어느 카드에 앉는지는 `slot_id`만이 가른다.
 *
 * 받은 행을 그대로 돌려준다 — 카드가 이름을 세려면 `profile_id`까지 쥐어야 하는데, 여기서
 * 좁혀 내면 부르는 쪽이 같은 행을 다시 찾게 된다.
 */
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
