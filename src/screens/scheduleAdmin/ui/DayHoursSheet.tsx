import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type DayHoursSheetProps = {
  starts: string;
  ends: string;
  canSave: boolean;
  saving: boolean;
  failed: boolean;
  onWriteStarts: (typed: string) => void;
  onWriteEnds: (typed: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function DayHoursSheet({
  starts,
  ends,
  canSave,
  saving,
  failed,
  onWriteStarts,
  onWriteEnds,
  onClose,
  onSave,
}: DayHoursSheetProps) {
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
          value={starts}
          onChangeText={onWriteStarts}
        />
        <Input
          className="flex-1"
          label="퇴근"
          testID="day-hours-end-input"
          placeholder="19:00"
          value={ends}
          onChangeText={onWriteEnds}
        />
      </View>

      <Text size="sm" tone="subtle" className="mt-2">
        이 날 배정된 전원에게 같이 적용돼요
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
          onPress={onSave}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
