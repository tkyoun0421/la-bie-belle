import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import {
  WAGE_CAP_HINT,
  WAGE_SAVE_FAILED_SUB,
  WAGE_SAVE_FAILED_TITLE,
  WAGE_TODAY_NOTE,
} from "@/screens/wages/consts/wages.const";
import {
  atWageCap,
  canSaveWage,
  formatAmountDisplay,
  nextAmountDigits,
} from "@/screens/wages/model/wageAmount.policy";

/**
 * 기본 시급을 정하는 시트다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`의 「기본 시급 시트」다.
 *
 * **몇 명이 같이 바뀌는지를 저장 전에 말한다.** 한 번 누르면 여러 사람의 급여가 같이
 * 달라지는 자리라 그 수가 손 앞에 있어야 한다.
 *
 * **확인을 한 번 더 안 묻는다.** 같은 날 다시 저장하면 그날 줄을 덮어써서 되돌릴 수
 * 있다(PAY-011) — 잘못 넣은 값이 이력에 쌓이지 않는다.
 *
 * **실패하면 제목 자리가 그 사실을 말하고 시트는 안 닫힌다.** 사람이 가장 먼저 걱정하는
 * 것이 방금 넣은 값이 날아갔는지라 그것을 먼저 말한다.
 */

export const WAGE_AMOUNT_INPUT_TEST_ID = "wage-amount-input";

const NO_FOLLOWER = "아직 이 값을 쓰는 사람이 없어요";

export type DefaultWageSheetProps = {
  currentAmount: number | null;
  followerCount: number;
  digits: string;
  sending: boolean;
  failed: boolean;
  onDigits: (digits: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function DefaultWageSheet({
  currentAmount,
  followerCount,
  digits,
  sending,
  failed,
  onDigits,
  onClose,
  onSave,
}: DefaultWageSheetProps) {
  const followerLine =
    followerCount === 0
      ? NO_FOLLOWER
      : `${followerCount}명의 시급이 같이 바뀌어요`;

  return (
    <>
      <Text size="lg" weight="semibold">
        {failed ? WAGE_SAVE_FAILED_TITLE : "기본 시급"}
      </Text>

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
      ) : null}

      <Text
        size="xs"
        weight="medium"
        className={failed ? "mt-1" : "mt-2"}
        numeric
      >
        {followerLine}
      </Text>

      {failed ? null : (
        <Text size="xs" tone="subtle" className="mt-1">
          {WAGE_TODAY_NOTE}
        </Text>
      )}

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
