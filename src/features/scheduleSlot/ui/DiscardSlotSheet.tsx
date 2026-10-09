import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { useDiscardSlotSheet } from "@/features/scheduleSlot/hooks/useDiscardSlotSheet";
import type { DiscardSlotSheetInput } from "@/features/scheduleSlot/model/discardSlotSheet.type";

export type DiscardSlotSheetProps = DiscardSlotSheetInput & {
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DiscardSlotSheet({
  removing,
  onCancel,
  onConfirm,
  ...input
}: DiscardSlotSheetProps) {
  const sheet = useDiscardSlotSheet(input);

  return (
    <>
      <Text size="lg" weight="bold">
        자리를 지울까요?
      </Text>

      <Text size="sm" tone="muted" className="mt-2">
        {sheet.warningLine}
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
