import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import {
  WAGE_AMOUNT_INPUT_TEST_ID,
  WAGE_SAVE_FAILED_SUB,
  WAGE_SAVE_FAILED_TITLE,
  WAGE_TODAY_NOTE,
  WAGES_COPY,
} from "@/screens/wages/consts/wages.const";
import type { WagesHistoryRow } from "@/screens/wages/hooks/useWagesScreen";

/**
 * 한 사람의 시급을 정하는 시트다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`의 「사람 시트」다.
 *
 * **열 때 지금 시급이 채워져 있다.** 기본을 쓰는 사람도 그 값이 채워져 있고, 고쳐 저장하면
 * 그때부터 개별이 된다.
 *
 * **이력은 받은 데이터에서 갈려 나온다.** 시트를 열 때 질의를 새로 안 던져 로딩이 없다
 * (plan payroll-wages AC-05).
 *
 * **이력 줄은 안 눌린다.** 화살표도 더보기도 없다 — 그 시점으로 되돌리는 문을 두면
 * 「지난 급여는 흔들리지 않는다」가 깨진다(PAY-010).
 *
 * **이력을 몇 줄 그릴지도 controller가 안다.** 「더 보기」가 늘리는 것이 조각의 모습이 아니라
 * 받는 줄 수라서다 — 이 파일이 받는 것은 이미 글자가 된 줄들이다.
 */

export type MemberWageSheetProps = {
  name: string;
  photoUrl: string | null;
  historyRows: readonly WagesHistoryRow[];
  historyHasMore: boolean;
  amountText: string;
  capHint: string | undefined;
  canSave: boolean;
  canReset: boolean;
  sending: boolean;
  failed: boolean;
  onDigits: (typed: string) => void;
  onExpand: () => void;
  onReset: () => void;
  onClose: () => void;
  onSave: () => void;
};

export function MemberWageSheet({
  name,
  photoUrl,
  historyRows,
  historyHasMore,
  amountText,
  capHint,
  canSave,
  canReset,
  sending,
  failed,
  onDigits,
  onExpand,
  onReset,
  onClose,
  onSave,
}: MemberWageSheetProps) {
  return (
    <>
      {failed ? (
        <Text size="lg" weight="semibold">
          {WAGE_SAVE_FAILED_TITLE}
        </Text>
      ) : (
        <View className="flex-row items-center gap-3">
          <Avatar name={name} photoUrl={photoUrl} />
          <Text size="lg" weight="semibold">
            {name}
          </Text>
        </View>
      )}

      <AmountInput
        className="mt-5"
        testID={WAGE_AMOUNT_INPUT_TEST_ID}
        value={amountText}
        hint={capHint}
        onChangeText={onDigits}
      />

      {failed ? (
        <Text size="sm" tone="muted" className="mt-2">
          {WAGE_SAVE_FAILED_SUB}
        </Text>
      ) : (
        <Text size="xs" tone="subtle" className="mt-2">
          {WAGE_TODAY_NOTE}
        </Text>
      )}

      {canReset ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 self-start px-0"
          onPress={onReset}
        >
          {WAGES_COPY.resetRow}
        </Button>
      ) : null}

      {historyRows.length > 0 ? (
        <>
          <Text size="base" weight="medium" className="mt-6">
            {WAGES_COPY.historyTitle}
          </Text>
          {historyRows.map((row) => (
            <View
              key={row.key}
              className="flex-row items-baseline justify-between gap-3 py-3"
            >
              <Text size="sm" tone="muted" numeric>
                {row.dateLabel}
              </Text>
              <Text size="sm" numeric>
                {row.amountLabel}
              </Text>
            </View>
          ))}
          {historyHasMore ? (
            <Button variant="ghost" size="sm" onPress={onExpand}>
              {WAGES_COPY.more}
            </Button>
          ) : null}
        </>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {WAGES_COPY.close}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={sending}
          disabled={!canSave}
          onPress={onSave}
        >
          {WAGES_COPY.save}
        </Button>
      </View>
    </>
  );
}
