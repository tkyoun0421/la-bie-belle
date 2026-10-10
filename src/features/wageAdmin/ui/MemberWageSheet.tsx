import { View } from "react-native";
import { AmountInput } from "@/shared/ui/AmountInput";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  WAGE_AMOUNT_INPUT_TEST_ID,
  WAGE_SAVE_FAILED_SUB,
  WAGE_SHEET_COPY,
  WAGE_TODAY_NOTE,
} from "@/features/wageAdmin/consts/wageAdmin.const";
import { useMemberWageSheet } from "@/features/wageAdmin/hooks/useMemberWageSheet";
import { ResetWageDialog } from "@/features/wageAdmin/ui/ResetWageDialog";

export type MemberWageSheetProps = {
  profileId: string;
  name: string;
  photoUrl: string | null;
  rates: readonly MemberWageRate[];
  hasDefaultWage: boolean;
  defaultWage: number | null;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function MemberWageSheet({
  profileId,
  name,
  photoUrl,
  rates,
  hasDefaultWage,
  defaultWage,
  onClose,
  onDone,
}: MemberWageSheetProps) {
  const sheet = useMemberWageSheet({
    profileId,
    name,
    photoUrl,
    rates,
    hasDefaultWage,
    defaultWage,
    onDone,
  });

  return (
    <>
      {sheet.failedLine === null ? (
        <View className="flex-row items-center gap-3">
          <Avatar name={sheet.name} photoUrl={sheet.photoUrl} />
          <Text size="lg" weight="semibold">
            {sheet.name}
          </Text>
        </View>
      ) : (
        <Text size="lg" weight="semibold">
          {sheet.failedLine}
        </Text>
      )}

      <AmountInput
        className="mt-5"
        testID={WAGE_AMOUNT_INPUT_TEST_ID}
        value={sheet.amountText}
        hint={sheet.capHint}
        onChangeText={sheet.write}
      />

      {sheet.failedLine === null ? (
        <Text size="xs" tone="subtle" className="mt-2">
          {WAGE_TODAY_NOTE}
        </Text>
      ) : (
        <Text size="sm" tone="muted" className="mt-2">
          {WAGE_SAVE_FAILED_SUB}
        </Text>
      )}

      {sheet.canReset ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 self-start px-0"
          onPress={sheet.askReset}
        >
          {WAGE_SHEET_COPY.resetRow}
        </Button>
      ) : null}

      {sheet.historyRows.length > 0 ? (
        <>
          <Text size="base" weight="medium" className="mt-6">
            {WAGE_SHEET_COPY.historyTitle}
          </Text>
          {sheet.historyRows.map((row) => (
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
          {sheet.historyHasMore ? (
            <Button variant="ghost" size="sm" onPress={sheet.expandHistory}>
              {WAGE_SHEET_COPY.more}
            </Button>
          ) : null}
        </>
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

      <ResetWageDialog
        visible={sheet.asking}
        body={sheet.resetBody}
        notice={sheet.resetNotice}
        onClose={sheet.cancelReset}
        onConfirm={sheet.confirmReset}
      />
    </>
  );
}
