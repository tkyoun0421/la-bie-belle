import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { useCloseDayWarningSheet } from "@/features/scheduleDay/hooks/useCloseDayWarningSheet";

export type CloseDayWarningSheetProps = {
  workDate: string;
  assignmentCount: number;
  onCancel: () => void;
  onDone: () => void;
};

export function CloseDayWarningSheet({
  workDate,
  assignmentCount,
  onCancel,
  onDone,
}: CloseDayWarningSheetProps) {
  const sheet = useCloseDayWarningSheet({ workDate, assignmentCount, onDone });

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
          loading={sheet.sending}
          onPress={sheet.close}
        >
          배정 지우고 닫기
        </Button>
      </View>
    </>
  );
}
