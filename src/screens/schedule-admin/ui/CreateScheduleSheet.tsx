import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import { formatMonthName } from "@/screens/schedule-admin/model/format-schedule-date";

/**
 * 달 근무표를 만드는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「달 근무표 만들기 짜임」이다.
 *
 * **만들기와 마감일이 한 동작이다.** 마감일 없이 만드는 길이 없어서(SCH-005) 화면도 둘을 안
 * 가른다. 만드는 순간 접수가 열리고 전원에게 알림이 나가므로 안내 줄이 누르기 전에 그것을
 * 말한다.
 *
 * 만들기가 실패하면 시트를 안 닫는다 — 적은 날짜가 사라지면 다시 적어야 한다.
 */

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type CreateScheduleSheetProps = {
  month: string;
  today: string;
  saving: boolean;
  failed: boolean;
  onClose: () => void;
  onCreate: (deadline: string) => void;
};

export function CreateScheduleSheet({
  month,
  today,
  saving,
  failed,
  onClose,
  onCreate,
}: CreateScheduleSheetProps) {
  const [deadline, setDeadline] = useState("");

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
        onChangeText={setDeadline}
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
          disabled={deadline < today}
          onPress={() => onCreate(deadline)}
        >
          만들기
        </Button>
      </View>
    </>
  );
}
