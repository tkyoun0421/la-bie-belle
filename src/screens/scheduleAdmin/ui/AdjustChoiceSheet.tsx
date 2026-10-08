import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { spellHours } from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";

export const ADJUSTMENT_EXTRA_MINUTES_INPUT_TEST_ID =
  "adjustment-extra-minutes-input";

const EXTRA_LABEL = "몇 분 더 일했나요?";

export type AdjustChoiceSheetProps = {
  name: string;
  assignedMinutes: number;
  canRevert: boolean;
  extending: boolean;
  digits: string;
  canSend: boolean;
  sending: boolean;
  failureMessage: string | null;
  onAbsent: () => void;
  onRevert: () => void;
  onStartExtending: () => void;
  onWriteDigits: (text: string) => void;
  onExtend: () => void;
  onClose: () => void;
};

export function AdjustChoiceSheet({
  name,
  assignedMinutes,
  canRevert,
  extending,
  digits,
  canSend,
  sending,
  failureMessage,
  onAbsent,
  onRevert,
  onStartExtending,
  onWriteDigits,
  onExtend,
  onClose,
}: AdjustChoiceSheetProps) {
  return (
    <View>
      <Text size="lg" weight="semibold">
        {name}
      </Text>

      <View className="mt-2">
        <ListRow title="결근이에요" onPress={onAbsent} />
        <ListRow title="연장이에요" onPress={onStartExtending} />
        {canRevert ? <ListRow title="원래대로" onPress={onRevert} /> : null}
      </View>

      {extending ? (
        <View className="mt-2 gap-2">
          <Text size="sm" tone="muted">
            {EXTRA_LABEL}
          </Text>
          <AmountInput
            testID={ADJUSTMENT_EXTRA_MINUTES_INPUT_TEST_ID}
            unit="분"
            value={digits}
            hint={`배정 ${spellHours(assignedMinutes)}에 더해져요`}
            onChangeText={onWriteDigits}
          />
        </View>
      ) : null}

      {failureMessage === null ? null : (
        <Text size="sm" tone="critical" className="mt-2">
          {failureMessage}
        </Text>
      )}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          닫기
        </Button>
        {extending ? (
          <Button
            variant="primary"
            className="flex-1"
            loading={sending}
            disabled={!canSend}
            onPress={onExtend}
          >
            바꾸기
          </Button>
        ) : null}
      </View>
    </View>
  );
}
