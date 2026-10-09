import { GraduationCap } from "lucide-react-native";
import { View } from "react-native";
import { Badge } from "@/shared/ui/Badge";
import { Draggable } from "@/shared/ui/Draggable";
import { DropTarget } from "@/shared/ui/DropTarget";
import { Icon } from "@/shared/ui/Icon";
import { SlotCard } from "@/shared/ui/SlotCard";
import { Text } from "@/shared/ui/Text";
import { usePositionRow } from "@/screens/scheduleAdmin/hooks/usePositionRow";
import type { PositionRowInput } from "@/screens/scheduleAdmin/model/positionRow.type";
import { PositionRowHead } from "@/screens/scheduleAdmin/ui/PositionRowHead";
import { PositionSlotCard } from "@/screens/scheduleAdmin/ui/PositionSlotCard";

const TRAINING_ICON_SIZE = 18;

export type PositionRowProps = PositionRowInput;

export function PositionRow(props: PositionRowProps) {
  const row = usePositionRow(props);

  return (
    <View className="mt-5">
      <DropTarget id={row.dragId}>
        <Draggable id={row.dragId} disabled={!row.draggable}>
          <PositionRowHead head={row.head} />
        </Draggable>
      </DropTarget>

      {row.showDragHint ? (
        <Text size="xs" tone="subtle" className="mt-1">
          자리는 아래로 끌면 삭제, 줄 머리를 다른 줄 머리에 겹치면 겸임이에요
        </Text>
      ) : null}

      <View className="mt-2 gap-2">
        {row.slots.map((slot) => (
          <PositionSlotCard key={slot.slotId} slot={slot} />
        ))}

        {row.trainings.map((training) => (
          <View
            key={training.assignmentId}
            className="flex-row items-center gap-2 px-4 py-1"
          >
            <Icon
              icon={GraduationCap}
              size={TRAINING_ICON_SIZE}
              tone="subtle"
            />
            <Text size="sm">{training.name}</Text>
            <Badge label="교육" variant="neutral" />
          </View>
        ))}

        {row.showAddSlot ? (
          <SlotCard variant="empty" onPress={row.addSlot}>
            <Text size="sm" tone="muted">
              자리 추가
            </Text>
          </SlotCard>
        ) : null}
      </View>
    </View>
  );
}
