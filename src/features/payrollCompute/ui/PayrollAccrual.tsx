import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import { usePayrollAccrual } from "@/features/payrollCompute/hooks/usePayrollAccrual";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";

export type PayrollAccrualProps = {
  span: DateSpan;
};

export function PayrollAccrual({ span }: PayrollAccrualProps) {
  const fragment = usePayrollAccrual(span);

  if (fragment.state !== "ready") {
    return null;
  }

  return (
    <View className="mt-6 gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text size="sm" tone="muted">
          {PAYROLL_VIEW_COPY.workLabel}
        </Text>
        <Text size="sm" weight="medium" numeric>
          {fragment.work}
        </Text>
      </View>

      {fragment.late === null ? null : (
        <View className="flex-row items-baseline justify-between">
          <Text size="sm" tone="muted">
            {PAYROLL_VIEW_COPY.lateLabel}
          </Text>
          <Text size="sm" weight="medium" numeric>
            {fragment.late}
          </Text>
        </View>
      )}
    </View>
  );
}
