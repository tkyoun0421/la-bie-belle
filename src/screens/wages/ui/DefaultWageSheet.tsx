import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import {
  WAGE_AMOUNT_INPUT_TEST_ID,
  WAGE_SAVE_FAILED_SUB,
  WAGE_SAVE_FAILED_TITLE,
  WAGE_TODAY_NOTE,
  WAGES_COPY,
} from "@/screens/wages/consts/wages.const";

export type DefaultWageSheetProps = {
  followerLine: string;
  amountText: string;
  capHint: string | undefined;
  canSave: boolean;
  sending: boolean;
  failed: boolean;
  onDigits: (typed: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function DefaultWageSheet({
  followerLine,
  amountText,
  capHint,
  canSave,
  sending,
  failed,
  onDigits,
  onClose,
  onSave,
}: DefaultWageSheetProps) {
  return (
    <>
      <Text size="lg" weight="semibold">
        {failed ? WAGE_SAVE_FAILED_TITLE : WAGES_COPY.baseTitle}
      </Text>

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
