import type { ReactNode } from "react";
import { View } from "react-native";
import { FragmentView } from "@/shared/ui/FragmentView";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import { usePayrollAccrual } from "@/features/payrollCompute/hooks/usePayrollAccrual";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";

export type PayrollAccrualProps = {
  span: DateSpan;
  pending?: ReactNode;
  failed?: ReactNode;
};

export function PayrollAccrual({ span, pending, failed }: PayrollAccrualProps) {
  const fragment = usePayrollAccrual(span);

  return (
    <FragmentView fragment={fragment} pending={pending} failed={failed}>
      {(ready) => (
        <View className="mt-6 gap-2">
          <View className="flex-row items-baseline justify-between">
            <Text size="sm" tone="muted">
              {PAYROLL_VIEW_COPY.workLabel}
            </Text>
            <Text size="sm" weight="medium" numeric>
              {ready.work}
            </Text>
          </View>

          {ready.late === null ? null : (
            <View className="flex-row items-baseline justify-between">
              <Text size="sm" tone="muted">
                {PAYROLL_VIEW_COPY.lateLabel}
              </Text>
              <Text size="sm" weight="medium" numeric>
                {ready.late}
              </Text>
            </View>
          )}
        </View>
      )}
    </FragmentView>
  );
}
