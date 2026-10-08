import {
  GraduationCap,
  GripVertical,
  Lock,
  LockOpen,
} from "lucide-react-native";
import { View } from "react-native";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Draggable } from "@/shared/ui/Draggable";
import { DropTarget } from "@/shared/ui/DropTarget";
import { Icon } from "@/shared/ui/Icon";
import { SlotCard } from "@/shared/ui/SlotCard";
import { Text } from "@/shared/ui/Text";
import type { ScheduleAssignment } from "@/entities/schedule/api/schedule.dto";
import {
  positionDragId,
  slotDragId,
} from "@/screens/scheduleAdmin/utils/dragId.utils";
import {
  assignmentForSlot,
  slotFillCount,
  type PositionSlot,
} from "@/screens/scheduleAdmin/utils/positionRows.utils";

const LOCK_ICON_SIZE = 18;

const HANDLE_ICON_SIZE = 18;

export type PositionRowProps = {
  position: string;
  slots: readonly PositionSlot[];
  assignments: readonly ScheduleAssignment[];
  unlocked: boolean;
  canChangeStructure: boolean;
  nameOf: (profileId: string) => string;
  requestBadgeOf: (slotId: string) => string | null;
  onToggleLock: () => void;
  onPressEducation: () => void;
  onPressSlot: (slotId: string) => void;
  onAddSlot: () => void;
};

export function PositionRow({
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
}: PositionRowProps) {
  const { filled, total } = slotFillCount(slots, assignments);
  const trainings = assignments.filter(
    (assignment) =>
      assignment.kind === "training" &&
      assignment.ended_at === null &&
      assignment.position === position,
  );

  const head = (
    <View className="flex-row items-center gap-2">
      <Text size="sm" weight="semibold">
        {`${position} `}
        <Text
          size="xs"
          tone={filled === total ? "subtle" : "neutral"}
          numeric
        >{`${filled}/${total}`}</Text>
      </Text>

      <View className="flex-1" />

      <Button
        variant="ghost"
        size="compact"
        testID={`schedule-education-button-${position}`}
        onPress={onPressEducation}
      >
        교육 붙이기
      </Button>

      {canChangeStructure ? (
        <Button
          variant="ghost"
          size="compact"
          square
          testID={`schedule-position-lock-${position}`}
          onPress={onToggleLock}
        >
          <Icon
            icon={unlocked ? LockOpen : Lock}
            size={LOCK_ICON_SIZE}
            tone="subtle"
          />
        </Button>
      ) : null}

      {unlocked ? (
        <Icon icon={GripVertical} size={HANDLE_ICON_SIZE} tone="subtle" />
      ) : null}
    </View>
  );

  return (
    <View className="mt-5">
      <DropTarget id={positionDragId(position)}>
        <Draggable id={positionDragId(position)} disabled={!unlocked}>
          {head}
        </Draggable>
      </DropTarget>

      {unlocked ? (
        <Text size="xs" tone="subtle" className="mt-1">
          자리는 아래로 끌면 삭제, 줄 머리를 다른 줄 머리에 겹치면 겸임이에요
        </Text>
      ) : null}

      <View className="mt-2 gap-2">
        {slots.map((slot, index) => {
          const taken = assignmentForSlot(slot.id, assignments);
          const merged = slot.positions.length > 1;
          const waiting = requestBadgeOf(slot.id);
          const card = (
            <SlotCard
              variant={taken === null ? "empty" : "filled"}
              testID={`schedule-slot-${position}-${index + 1}`}
              onPress={() => onPressSlot(slot.id)}
              right={
                merged || waiting !== null ? (
                  <View className="flex-row items-center gap-1">
                    {merged ? (
                      <Badge label={slot.positions.join("·")} variant="brand" />
                    ) : null}
                    {waiting === null ? null : (
                      <Badge label={waiting} variant="neutral" />
                    )}
                  </View>
                ) : undefined
              }
            >
              <Text size="sm" tone={taken === null ? "subtle" : "neutral"}>
                {taken === null ? "비어 있어요" : nameOf(taken.profile_id)}
              </Text>
              {unlocked ? (
                <Icon
                  icon={GripVertical}
                  size={HANDLE_ICON_SIZE}
                  tone="subtle"
                />
              ) : null}
            </SlotCard>
          );

          return unlocked ? (
            <Draggable key={slot.id} id={slotDragId(slot.id)}>
              {card}
            </Draggable>
          ) : (
            <View key={slot.id}>{card}</View>
          );
        })}

        {trainings.map((training) => (
          <View
            key={training.id}
            className="flex-row items-center gap-2 px-4 py-1"
          >
            <Icon icon={GraduationCap} size={HANDLE_ICON_SIZE} tone="subtle" />
            <Text size="sm">{nameOf(training.profile_id)}</Text>
            <Badge label="교육" variant="neutral" />
          </View>
        ))}

        {unlocked ? (
          <SlotCard variant="empty" onPress={onAddSlot}>
            <Text size="sm" tone="muted">
              자리 추가
            </Text>
          </SlotCard>
        ) : null}
      </View>
    </View>
  );
}
