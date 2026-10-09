import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { useCloseDayWarningSheet } from "@/screens/scheduleAdmin/hooks/useCloseDayWarningSheet";
import type { CloseDayWarningSheetInput } from "@/screens/scheduleAdmin/model/closeDayWarningSheet.type";

export type CloseDayWarningSheetProps = CloseDayWarningSheetInput & {
  closing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CloseDayWarningSheet({
  closing,
  onCancel,
  onConfirm,
  ...input
}: CloseDayWarningSheetProps) {
  const sheet = useCloseDayWarningSheet(input);

  return (
    <>
      <Text size="lg" weight="bold">
        {sheet.title}
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
          loading={closing}
          onPress={onConfirm}
        >
          배정 지우고 닫기
        </Button>
      </View>
    </>
  );
}
