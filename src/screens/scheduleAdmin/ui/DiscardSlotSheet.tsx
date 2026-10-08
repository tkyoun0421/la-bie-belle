import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { discardSlotWarningLine } from "@/screens/scheduleAdmin/model/discardSlot.policy";

export type DiscardSlotSheetProps = {
  name: string;
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DiscardSlotSheet({
  name,
  removing,
  onCancel,
  onConfirm,
}: DiscardSlotSheetProps) {
  return (
    <>
      <Text size="lg" weight="bold">
        자리를 지울까요?
      </Text>

      <Text size="sm" tone="muted" className="mt-2">
        {discardSlotWarningLine(name)}
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onCancel}>
          그만두기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={removing}
          onPress={onConfirm}
        >
          지우기
        </Button>
      </View>
    </>
  );
}
