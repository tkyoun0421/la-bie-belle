import { GripVertical, Lock, LockOpen } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import type { PositionRowHeadView } from "@/screens/scheduleAdmin/model/positionRow.type";

const LOCK_ICON_SIZE = 18;

const HANDLE_ICON_SIZE = 18;

export type PositionRowHeadProps = {
  head: PositionRowHeadView;
};

export function PositionRowHead({ head }: PositionRowHeadProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Text size="sm" weight="semibold">
        {`${head.position} `}
        <Text
          size="xs"
          tone={head.fillTone}
          numeric
        >{`${head.fillLabel}`}</Text>
      </Text>

      <View className="flex-1" />

      <Button
        variant="ghost"
        size="compact"
        testID={head.educationTestId}
        onPress={head.pressEducation}
      >
        교육 붙이기
      </Button>

      {head.showLock ? (
        <Button
          variant="ghost"
          size="compact"
          square
          testID={head.lockTestId}
          onPress={head.toggleLock}
        >
          <Icon
            icon={head.unlocked ? LockOpen : Lock}
            size={LOCK_ICON_SIZE}
            tone="subtle"
          />
        </Button>
      ) : null}

      {head.showHandle ? (
        <Icon icon={GripVertical} size={HANDLE_ICON_SIZE} tone="subtle" />
      ) : null}
    </View>
  );
}
