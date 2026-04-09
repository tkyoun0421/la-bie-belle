import { useState } from "react";

type UseDragReorderStateOptions = {
  disabled?: boolean;
};

export function useDragReorderState({
  disabled = false,
}: UseDragReorderStateOptions = {}) {
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dropTargetItemId, setDropTargetItemId] = useState<string | null>(null);

  function startDrag(itemId: string) {
    if (disabled) {
      return;
    }

    setDraggingItemId(itemId);
    setDropTargetItemId(null);
  }

  function setDropTarget(itemId: string) {
    if (disabled || !draggingItemId || draggingItemId === itemId) {
      return;
    }

    setDropTargetItemId(itemId);
  }

  function clearDragState() {
    setDraggingItemId(null);
    setDropTargetItemId(null);
  }

  return {
    clearDragState,
    draggingItemId,
    dropTargetItemId,
    setDropTarget,
    startDrag,
  };
}
