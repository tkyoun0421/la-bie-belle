import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import {
  WAGE_AMOUNT_INPUT_TEST_ID,
  WAGE_SAVE_FAILED_SUB,
  WAGE_SHEET_COPY,
  WAGE_TODAY_NOTE,
} from "@/features/wageAdmin/consts/wageAdmin.const";
import { useDefaultWageSheet } from "@/features/wageAdmin/hooks/useDefaultWageSheet";

export type DefaultWageSheetProps = {
  defaultWage: number | null;
  followerCount: number;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function DefaultWageSheet({
  defaultWage,
  followerCount,
  onClose,
  onDone,
}: DefaultWageSheetProps) {
  const sheet = useDefaultWageSheet({ defaultWage, followerCount, onDone });

  return (
    <>
      <Text size="lg" weight="semibold">
        {sheet.failedLine ?? WAGE_SHEET_COPY.baseTitle}
      </Text>

      <AmountInput
        className="mt-5"
        testID={WAGE_AMOUNT_INPUT_TEST_ID}
        value={sheet.amountText}
        hint={sheet.capHint}
        onChangeText={sheet.write}
      />

      {sheet.failedLine === null ? null : (
        <Text size="sm" tone="muted" className="mt-2">
          {WAGE_SAVE_FAILED_SUB}
        </Text>
      )}

      <Text
        size="xs"
        weight="medium"
        className={sheet.failedLine === null ? "mt-2" : "mt-1"}
        numeric
      >
        {sheet.followerLine}
      </Text>

      {sheet.failedLine === null ? (
        <Text size="xs" tone="subtle" className="mt-1">
          {WAGE_TODAY_NOTE}
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {WAGE_SHEET_COPY.close}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={sheet.sending}
          disabled={!sheet.canSave}
          onPress={sheet.save}
        >
          {WAGE_SHEET_COPY.save}
        </Button>
      </View>
    </>
  );
}
