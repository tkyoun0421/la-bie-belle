import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { canResetToDefault } from "@/screens/wages/model/can-reset-to-default";
import {
  atWageCap,
  canSaveWage,
  formatAmountDisplay,
  nextAmountDigits,
  spellWon,
  WAGE_CAP_HINT,
  WAGE_SAVE_FAILED_SUB,
  WAGE_SAVE_FAILED_TITLE,
  WAGE_TODAY_NOTE,
} from "@/screens/wages/model/wage-amount";
import {
  buildWageHistory,
  spellWageDate,
} from "@/screens/wages/model/wage-history";
import type { WageRateRow } from "@/screens/wages/model/wage-rows";
import { WAGE_AMOUNT_INPUT_TEST_ID } from "@/screens/wages/ui/DefaultWageSheet";

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
 */

const HISTORY_TITLE = "이력";

export type MemberWageSheetProps = {
  name: string;
  photoUrl: string | null;
  rates: readonly WageRateRow[];
  currentAmount: number | null;
  hasDefaultWage: boolean;
  digits: string;
  expanded: boolean;
  sending: boolean;
  failed: boolean;
  onDigits: (digits: string) => void;
  onExpand: () => void;
  onReset: () => void;
  onClose: () => void;
  onSave: () => void;
};

export function MemberWageSheet({
  name,
  photoUrl,
  rates,
  currentAmount,
  hasDefaultWage,
  digits,
  expanded,
  sending,
  failed,
  onDigits,
  onExpand,
  onReset,
  onClose,
  onSave,
}: MemberWageSheetProps) {
  const history = buildWageHistory(rates, expanded);

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
        value={formatAmountDisplay(digits)}
        hint={atWageCap(digits) ? WAGE_CAP_HINT : undefined}
        onChangeText={(text) => onDigits(nextAmountDigits(digits, text))}
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

      {canResetToDefault(rates, hasDefaultWage) ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 self-start px-0"
          onPress={onReset}
        >
          기본 시급으로 되돌리기
        </Button>
      ) : null}

      {history.rows.length > 0 ? (
        <>
          <Text size="base" weight="medium" className="mt-6">
            {HISTORY_TITLE}
          </Text>
          {history.rows.map((row) => (
            <View
              key={row.effective_date}
              className="flex-row items-baseline justify-between gap-3 py-3"
            >
              <Text size="sm" tone="muted" numeric>
                {spellWageDate(row.effective_date)}
              </Text>
              <Text size="sm" numeric>
                {spellWon(row.amount)}
              </Text>
            </View>
          ))}
          {history.hasMore ? (
            <Button variant="ghost" size="sm" onPress={onExpand}>
              더 보기
            </Button>
          ) : null}
        </>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          닫기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={sending}
          disabled={!canSaveWage(digits, currentAmount)}
          onPress={onSave}
        >
          저장
        </Button>
      </View>
    </>
  );
}
