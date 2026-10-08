import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { closeDayWarningLine } from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";
import { formatBareDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

export type CloseDayWarningSheetProps = {
  workDate: string;
  assignmentCount: number;
  closing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CloseDayWarningSheet({
  workDate,
  assignmentCount,
  closing,
  onCancel,
  onConfirm,
}: CloseDayWarningSheetProps) {
  return (
    <>
      <Text size="lg" weight="bold">
        {`${formatBareDate(workDate)}을 닫을까요?`}
      </Text>

      <Text size="sm" tone="muted" className="mt-2">
        {closeDayWarningLine(assignmentCount)}
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
