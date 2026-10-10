import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import type { HallSlot } from "@/entities/hall/model/hall.type";
import { useHallDefaultsSheet } from "@/features/hallDefaults/hooks/useHallDefaultsSheet";

export type HallDefaultsSheetProps = {
  starts: string;
  ends: string;
  slots: HallSlot[];
  onClose: () => void;
  onSaved: () => void;
};

export function HallDefaultsSheet({
  starts,
  ends,
  slots,
  onClose,
  onSaved,
}: HallDefaultsSheetProps) {
  const sheet = useHallDefaultsSheet({ starts, ends, slots, onSaved });

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
          value={sheet.starts}
          onChangeText={sheet.writeStarts}
        />
        <Input
          className="flex-1"
          label="퇴근"
          testID="hall-defaults-end-input"
          placeholder="19:00"
          value={sheet.ends}
          onChangeText={sheet.writeEnds}
        />
      </View>

      <Text size="sm" tone="subtle" className="mt-2">
        날을 열면 이 시간이 깔려요. 이미 연 날은 그대로예요
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
          loading={sheet.sending}
          onPress={sheet.save}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
