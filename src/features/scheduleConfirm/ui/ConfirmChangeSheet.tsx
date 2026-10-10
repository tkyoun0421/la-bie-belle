import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { useConfirmChangeSheet } from "@/features/scheduleConfirm/hooks/useConfirmChangeSheet";
import type { ConfirmChangeSheetInput } from "@/features/scheduleConfirm/model/confirmChangeSheet.type";

export type ConfirmChangeSheetProps = ConfirmChangeSheetInput & {
  sending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmChangeSheet({
  sending,
  onClose,
  onConfirm,
  ...input
}: ConfirmChangeSheetProps) {
  const sheet = useConfirmChangeSheet(input);

  return (
    <>
      <Text size="lg" weight="bold">
        {sheet.title}
      </Text>

      <Text size="sm" tone="muted" className="mt-2">
        {sheet.notice}
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {sheet.cancelLabel}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={sending}
          onPress={onConfirm}
        >
          {sheet.confirmLabel}
        </Button>
      </View>
    </>
  );
}
