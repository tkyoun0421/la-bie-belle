import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import { useCreateScheduleSheet } from "@/screens/scheduleAdmin/hooks/useCreateScheduleSheet";
import type { CreateScheduleSheetInput } from "@/screens/scheduleAdmin/model/createScheduleSheet.type";

export type CreateScheduleSheetProps = CreateScheduleSheetInput & {
  today: string;
  deadline: string;
  canSave: boolean;
  saving: boolean;
  onWriteDeadline: (typed: string) => void;
  onClose: () => void;
  onCreate: () => void;
};

export function CreateScheduleSheet({
  today,
  deadline,
  canSave,
  saving,
  onWriteDeadline,
  onClose,
  onCreate,
  ...input
}: CreateScheduleSheetProps) {
  const sheet = useCreateScheduleSheet(input);

  return (
    <>
      <Text size="lg" weight="bold">
        {sheet.title}
      </Text>

      <Input
        className="mt-6"
        label="스케줄 신청 마감일"
        testID="schedule-create-deadline-input"
        placeholder={today}
        autoCapitalize="none"
        value={deadline}
        onChangeText={onWriteDeadline}
      />

      <Text size="sm" tone="subtle" className="mt-2">
        오늘 이전은 고를 수 없어요
      </Text>

      <Text size="xs" tone="muted" className="mt-4">
        {sheet.noticeLine}
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
          loading={saving}
          disabled={!canSave}
          onPress={onCreate}
        >
          만들기
        </Button>
      </View>
    </>
  );
}
