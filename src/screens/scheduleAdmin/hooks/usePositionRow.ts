import {
  assignmentForSlot,
  slotFillCount,
} from "@/entities/schedule/utils/positionRows.utils";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type {
  PositionRowBadge,
  PositionRowController,
  PositionRowInput,
  PositionRowSlotView,
} from "@/screens/scheduleAdmin/model/positionRow.type";
import {
  positionDragId,
  slotDragId,
} from "@/screens/scheduleAdmin/utils/dragId.utils";

const EDUCATION_TEST_ID_PREFIX = "schedule-education-button-";

const LOCK_TEST_ID_PREFIX = "schedule-position-lock-";

const SLOT_TEST_ID_PREFIX = "schedule-slot-";

export function usePositionRow({
  position,
  slots,
  assignments,
  unlocked,
  canChangeStructure,
  nameOf,
  requestBadgeOf,
  onToggleLock,
  onPressEducation,
  onPressSlot,
  onAddSlot,
}: PositionRowInput): PositionRowController {
  const { filled, total } = slotFillCount(slots, assignments);

  return {
    dragId: positionDragId(position),
    draggable: unlocked,
    head: {
      position,
      fillLabel: `${filled}/${total}`,
      fillTone: filled === total ? "subtle" : "neutral",
      educationTestId: `${EDUCATION_TEST_ID_PREFIX}${position}`,
      lockTestId: `${LOCK_TEST_ID_PREFIX}${position}`,
      showLock: canChangeStructure,
      unlocked,
      showHandle: unlocked,
      toggleLock: onToggleLock,
      pressEducation: onPressEducation,
    },
    showDragHint: unlocked,
    slots: slots.map((slot, at): PositionRowSlotView => {
      const taken = assignmentForSlot(slot.id, assignments);
      const waiting = requestBadgeOf(slot.id);
      const merged: PositionRowBadge[] =
        slot.positions.length > 1
          ? [
              {
                label: slot.positions.join(
                  SCHEDULE_ADMIN_COPY.mergedPositionSeparator,
                ),
                variant: "brand",
              },
            ]
          : [];

      return {
        slotId: slot.id,
        dragId: slotDragId(slot.id),
        testId: `${SLOT_TEST_ID_PREFIX}${position}-${at + 1}`,
        variant: taken === null ? "empty" : "filled",
        nameLine:
          taken === null
            ? SCHEDULE_ADMIN_COPY.emptySlotLine
            : nameOf(taken.profileId),
        nameTone: taken === null ? "subtle" : "neutral",
        badges:
          waiting === null
            ? merged
            : [...merged, { label: waiting, variant: "neutral" }],
        draggable: unlocked,
        showHandle: unlocked,
        press: () => onPressSlot(slot.id),
      };
    }),
    trainings: assignments
      .filter(
        (assignment) =>
          assignment.kind === "training" &&
          assignment.endedAt === null &&
          assignment.position === position,
      )
      .map((assignment) => ({
        assignmentId: assignment.id,
        name: nameOf(assignment.profileId),
      })),
    showAddSlot: unlocked,
    addSlot: onAddSlot,
  };
}
