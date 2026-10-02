/**
 * 날 상세에서 끌고 놓는 것들의 식별자 꼴이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「잠금과 구조 변경」이다.
 *
 * **꼴을 아는 자리가 하나다.** 줄 머리와 자리 카드와 버리는 영역이 한 이름 공간을 나눠 쓰는데,
 * 집는 쪽은 `ui`고 「받아도 되나」를 판정하는 쪽은 controller다 — 접두사를 양쪽이 각자 적으면
 * 한쪽만 고쳤을 때 놓이는 것이 조용히 안 받아진다.
 *
 * **되읽기가 갈래를 같이 답한다.** 남의 꼴이면 `null`이라 부르는 쪽이 접두사를 다시 안 센다.
 */

const POSITION_PREFIX = "position:";

const SLOT_PREFIX = "slot:";

/** 자리를 버리는 영역 하나다 — 날 상세에 그 영역이 하나뿐이라 이름도 하나다. */
export const DISCARD_DROP_ID = "discard";

export function positionDragId(position: string): string {
  return `${POSITION_PREFIX}${position}`;
}

export function slotDragId(slotId: string): string {
  return `${SLOT_PREFIX}${slotId}`;
}

export function positionOf(dragId: string): string | null {
  return dragId.startsWith(POSITION_PREFIX)
    ? dragId.slice(POSITION_PREFIX.length)
    : null;
}

export function slotOf(dragId: string): string | null {
  return dragId.startsWith(SLOT_PREFIX)
    ? dragId.slice(SLOT_PREFIX.length)
    : null;
}
