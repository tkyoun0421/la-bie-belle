const POSITION_PREFIX = "position:";

const SLOT_PREFIX = "slot:";

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
