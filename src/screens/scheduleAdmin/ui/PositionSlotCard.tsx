import { GripVertical } from "lucide-react-native";
import { View } from "react-native";
import { Badge } from "@/shared/ui/Badge";
import { Draggable } from "@/shared/ui/Draggable";
import { Icon } from "@/shared/ui/Icon";
import { SlotCard } from "@/shared/ui/SlotCard";
import { Text } from "@/shared/ui/Text";
import type { PositionRowSlotView } from "@/screens/scheduleAdmin/model/positionRow.type";

const HANDLE_ICON_SIZE = 18;

export type PositionSlotCardProps = {
  slot: PositionRowSlotView;
};

export function PositionSlotCard({ slot }: PositionSlotCardProps) {
  const card = (
    <SlotCard
      variant={slot.variant}
      testID={slot.testId}
      onPress={slot.press}
      right={
        slot.badges.length === 0 ? undefined : (
          <View className="flex-row items-center gap-1">
            {slot.badges.map((badge) => (
              <Badge
                key={badge.label}
                label={badge.label}
                variant={badge.variant}
              />
            ))}
          </View>
        )
      }
    >
      <Text size="sm" tone={slot.nameTone}>
        {slot.nameLine}
      </Text>
      {slot.showHandle ? (
        <Icon icon={GripVertical} size={HANDLE_ICON_SIZE} tone="subtle" />
      ) : null}
    </SlotCard>
  );

  if (slot.draggable) {
    return <Draggable id={slot.dragId}>{card}</Draggable>;
  }

  return <View>{card}</View>;
}
