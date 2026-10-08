import { createContext, useContext } from "react";
import type { View } from "react-native";

export type DropState = "idle" | "over" | "over-blocked";

export type DragContextValue = {
  draggingId: string | null;
  overId: string | null;
  blocked: boolean;
  registerTarget: (id: string, view: View | null) => void;
  begin: (id: string) => void;
  move: (x: number, y: number) => void;
  finish: () => void;
};

export const DragContext = createContext<DragContextValue | null>(null);

export function useDrag(): DragContextValue {
  const value = useContext(DragContext);

  if (value === null) {
    throw new Error("DragProvider 안에서만 쓴다");
  }

  return value;
}

export function useDragging(): boolean {
  return useDrag().draggingId !== null;
}

export function useDropState(id: string): DropState {
  const { overId, blocked } = useDrag();

  if (overId !== id) {
    return "idle";
  }

  return blocked ? "over-blocked" : "over";
}
