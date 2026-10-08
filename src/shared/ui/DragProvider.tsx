import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { type View } from "react-native";
import { DragContext } from "@/shared/stores/drag.context";

type Rect = { x: number; y: number; width: number; height: number };

function contains(rect: Rect, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

export type DragProviderProps = {
  onDrop: (dragId: string, dropId: string) => void;
  canDrop?: (dragId: string, dropId: string) => boolean;
  children: ReactNode;
};

export function DragProvider({ onDrop, canDrop, children }: DragProviderProps) {
  const views = useRef(new Map<string, View>()).current;
  const rects = useRef(new Map<string, Rect>()).current;
  const dragging = useRef<string | null>(null);
  const over = useRef<string | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const registerTarget = useCallback(
    (id: string, view: View | null) => {
      if (view === null) {
        views.delete(id);
        rects.delete(id);
        return;
      }

      views.set(id, view);
    },
    [rects, views],
  );

  const begin = useCallback(
    (id: string) => {
      rects.clear();
      dragging.current = id;
      setDraggingId(id);

      for (const [targetId, view] of views) {
        view.measureInWindow((x, y, width, height) => {
          rects.set(targetId, { x, y, width, height });
        });
      }
    },
    [rects, views],
  );

  const move = useCallback(
    (x: number, y: number) => {
      const dragId = dragging.current;

      if (dragId === null) {
        return;
      }

      let found: string | null = null;

      for (const [targetId, rect] of rects) {
        if (targetId !== dragId && contains(rect, x, y)) {
          found = targetId;
        }
      }

      over.current = found;
      setOverId(found);
      setBlocked(
        found !== null && canDrop !== undefined && !canDrop(dragId, found),
      );
    },
    [canDrop, rects],
  );

  const finish = useCallback(() => {
    const dragId = dragging.current;
    const dropId = over.current;
    const allowed =
      dragId !== null &&
      dropId !== null &&
      (canDrop === undefined || canDrop(dragId, dropId));

    dragging.current = null;
    over.current = null;
    setDraggingId(null);
    setOverId(null);
    setBlocked(false);

    if (allowed) {
      onDrop(dragId, dropId);
    }
  }, [canDrop, onDrop]);

  const value = useMemo(
    () => ({
      draggingId,
      overId,
      blocked,
      registerTarget,
      begin,
      move,
      finish,
    }),
    [draggingId, overId, blocked, registerTarget, begin, move, finish],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}
