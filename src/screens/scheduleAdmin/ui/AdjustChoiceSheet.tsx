import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { spellHours } from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";

/**
 * 조정 시트의 사람 줄을 누르면 그 위에 한 겹 더 서는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 조정」이다.
 *
 * **이름이 「사람 시트」가 아닌 것은 [사람 픽커](PersonSheet.tsx)가 그 이름을 이미 써서다** —
 * 그쪽은 읽기 전용 카드고 이쪽은 값을 쓰는 자리다.
 *
 * **결근은 값을 안 묻는다.** 고른 즉시 나가고, 넣을 음수는 부르는 쪽이 그날 배정 시간에서
 * 계산한다(`absenceMinutes.ts`).
 *
 * **연장을 고르면 분 칸이 열리고 버튼이 「닫기 · 바꾸기」로 바뀐다.** 근무 시간 시트와 같은
 * 짝이다.
 *
 * **「원래대로」는 조정 행이 있는 사람에게만 선다.** 판정은 `showRevertOption`이 한다.
 */

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
