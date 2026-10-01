import {
  GraduationCap,
  GripVertical,
  Lock,
  LockOpen,
} from "lucide-react-native";
import { View } from "react-native";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Draggable, DropTarget } from "@/shared/ui/DragAndDrop";
import { Icon } from "@/shared/ui/Icon";
import { SlotCard } from "@/shared/ui/SlotCard";
import { Text } from "@/shared/ui/Text";
import type { ScheduleAssignment } from "@/entities/schedule/dals/getMonthSchedule";
import {
  assignmentForSlot,
  slotFillCount,
  type PositionSlot,
} from "@/screens/schedule-admin/model/positionRows";

/**
 * 포지션 한 줄이다 — 줄 머리와 그 아래 자리 카드들
 * (`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「포지션과 자리」).
 *
 * **줄 머리의 이름과 셈이 한 글월이다.** 「안내 1/2」로 붙여 읽히는 하나라 두 조각으로
 * 쪼개지 않는다 — 크기와 색만 안쪽에서 갈린다.
 *
 * **집는 것이 둘이다.** 줄 머리는 다른 줄 머리로만 가고 자리 카드는 버리는 영역으로만 간다.
 * 어디에 놓였는지는 `shared/ui`의 끌기 조각이 알고, 받아도 되는지는 화면이 `merge-target.ts`로
 * 답한다.
 *
 * **교육 붙이기는 잠금과 무관하다.** 자리를 안 먹어 구조 변경이 아니다(SCH-012).
 *
 * **대기 배지는 카드 문구를 안 건드린다.** 비어 있다는 사실과 물어봤다는 사실은 다른 것이라
 * 「비어 있어요」 위에 배지가 얹힌다. 합친 자리면 겸임 배지와 나란히 선다.
 */

const LOCK_ICON_SIZE = 18;

const HANDLE_ICON_SIZE = 18;

export const ROW_DRAG_PREFIX = "position:";

export const SLOT_DRAG_PREFIX = "slot:";

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
      <DropTarget id={`${ROW_DRAG_PREFIX}${position}`}>
        <Draggable id={`${ROW_DRAG_PREFIX}${position}`} disabled={!unlocked}>
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
            <Draggable key={slot.id} id={`${SLOT_DRAG_PREFIX}${slot.id}`}>
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
