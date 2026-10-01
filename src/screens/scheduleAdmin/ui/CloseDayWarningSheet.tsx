import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { closeDayWarningLine } from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";
import { formatBareDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

/**
 * 배정이 든 날을 닫기 전에 서는 확인이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 닫기 경고」다.
 *
 * **왼쪽이 「닫기」가 아니라 「그만두기」다.** 이 시트에서 「닫기」는 시트를 닫는 것과 날을
 * 닫는 것 둘로 읽힌다 — 규칙이 「취소」를 막은 이유가 여기서는 「닫기」에 붙는다.
 *
 * **오른쪽이 destructive가 아니다.** 배정은 사라지지만 날은 다시 열고 다시 배정할 수 있다.
 */

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
