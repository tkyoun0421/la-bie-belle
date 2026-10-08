import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type HallDefaultsSheetProps = {
  starts: string;
  ends: string;
  saving: boolean;
  failed: boolean;
  onStarts: (typed: string) => void;
  onEnds: (typed: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function HallDefaultsSheet({
  starts,
  ends,
  saving,
  failed,
  onStarts,
  onEnds,
  onClose,
  onSave,
}: HallDefaultsSheetProps) {
  return (
    <>
      <Text size="lg" weight="semibold">
        근무 시간 기본값
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Input
          className="flex-1"
          label="출근"
          testID="hall-defaults-start-input"
          placeholder="10:00"
          value={starts}
          onChangeText={onStarts}
        />
        <Input
          className="flex-1"
          label="퇴근"
          testID="hall-defaults-end-input"
          placeholder="19:00"
          value={ends}
          onChangeText={onEnds}
        />
      </View>

      <Text size="sm" tone="subtle" className="mt-2">
        날을 열면 이 시간이 깔려요. 이미 연 날은 그대로예요
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
          onPress={onSave}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
