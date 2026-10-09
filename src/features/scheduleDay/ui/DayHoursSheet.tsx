import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import { useDayHoursSheet } from "@/features/scheduleDay/hooks/useDayHoursSheet";

export type DayHoursSheetProps = {
  workDate: string;
  startsAt: string;
  endsAt: string;
  onClose: () => void;
};

export function DayHoursSheet({
  workDate,
  startsAt,
  endsAt,
  onClose,
}: DayHoursSheetProps) {
  const sheet = useDayHoursSheet({
    workDate,
    startsAt,
    endsAt,
    onDone: onClose,
  });

  return (
    <>
      <Text size="lg" weight="bold">
        근무 시간
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Input
          className="flex-1"
          label="출근"
          testID="day-hours-start-input"
          placeholder="10:00"
          value={sheet.starts}
          onChangeText={sheet.writeStarts}
        />
        <Input
          className="flex-1"
          label="퇴근"
          testID="day-hours-end-input"
          placeholder="19:00"
          value={sheet.ends}
          onChangeText={sheet.writeEnds}
        />
      </View>

      <Text size="sm" tone="subtle" className="mt-2">
        이 날 배정된 전원에게 같이 적용돼요
      </Text>

      {sheet.failedLine === null ? null : (
        <Text size="sm" tone="critical" className="mt-2">
          {sheet.failedLine}
        </Text>
      )}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          닫기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={sheet.saving}
          disabled={!sheet.canSave}
          onPress={sheet.save}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
