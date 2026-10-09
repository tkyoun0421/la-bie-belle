import type { DayDetailPositionRow } from "@/screens/scheduleAdmin/model/dayDetail.type";

export type PositionRowInput = DayDetailPositionRow;

export type PositionRowTone = "subtle" | "neutral";

export type PositionRowBadge = {
  label: string;
  variant: "brand" | "neutral";
};

export type PositionRowHeadView = {
  position: string;
  fillLabel: string;
  fillTone: PositionRowTone;
  educationTestId: string;
  lockTestId: string;
  showLock: boolean;
  unlocked: boolean;
  showHandle: boolean;
  toggleLock: () => void;
  pressEducation: () => void;
};

export type PositionRowSlotView = {
  slotId: string;
  dragId: string;
  testId: string;
  variant: "empty" | "filled";
  nameLine: string;
  nameTone: PositionRowTone;
  badges: readonly PositionRowBadge[];
  draggable: boolean;
  showHandle: boolean;
  press: () => void;
};

export type PositionRowTraining = {
  assignmentId: string;
  name: string;
};

export type PositionRowController = {
  dragId: string;
  draggable: boolean;
  head: PositionRowHeadView;
  showDragHint: boolean;
  slots: readonly PositionRowSlotView[];
  trainings: readonly PositionRowTraining[];
  showAddSlot: boolean;
  addSlot: () => void;
};
