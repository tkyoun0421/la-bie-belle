import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import { formatMonthName } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type CreateScheduleSheetProps = {
  month: string;
  today: string;
  deadline: string;
  canSave: boolean;
  saving: boolean;
  failed: boolean;
  onWriteDeadline: (typed: string) => void;
  onClose: () => void;
  onCreate: () => void;
};

export function CreateScheduleSheet({
  month,
  today,
  deadline,
  canSave,
  saving,
  failed,
  onWriteDeadline,
  onClose,
  onCreate,
}: CreateScheduleSheetProps) {
  const monthName = formatMonthName(month);

  return (
    <>
      <Text size="lg" weight="bold">
        {`${monthName} 근무표 만들기`}
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
        {`만드는 순간 ${monthName} 근무 신청 접수가 열리고, 근무자 전원에게 알림이 가요`}
      </Text>

      {failed ? (
        <Text size="sm" tone="critical" className="mt-2">
          {SAVE_FAILED}
        </Text>
      ) : null}

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
