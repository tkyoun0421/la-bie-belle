import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_COPY } from "@/screens/payroll/consts/payroll.const";
import type { PayrollAccrual as Accrual } from "@/screens/payroll/utils/summary.utils";

export type PayrollAccrualProps = {
  accrual: Accrual;
};

export function PayrollAccrual({ accrual }: PayrollAccrualProps) {
  return (
    <View className="mt-6 gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text size="sm" tone="muted">
          {PAYROLL_COPY.workLabel}
        </Text>
        <Text size="sm" weight="medium" numeric>
          {accrual.work}
        </Text>
      </View>

      {accrual.late === null ? null : (
        <View className="flex-row items-baseline justify-between">
          <Text size="sm" tone="muted">
            {PAYROLL_COPY.lateLabel}
          </Text>
          <Text size="sm" weight="medium" numeric>
            {accrual.late}
          </Text>
        </View>
      )}
    </View>
  );
}
