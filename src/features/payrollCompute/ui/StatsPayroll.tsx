import type { ReactNode } from "react";
import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";
import { useStatsPayroll } from "@/features/payrollCompute/hooks/useStatsPayroll";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";

export type StatsPayrollProps = {
  span: DateSpan;
  onOpenHistory: () => void;
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
};

export function StatsPayroll({
  span,
  onOpenHistory,
  pending,
  failed,
}: StatsPayrollProps) {
  const fragment = useStatsPayroll(span);

  if (fragment.state === "pending") {
    return pending ?? null;
  }

  if (fragment.state === "failed") {
    return failed?.(fragment.retry) ?? null;
  }

  return (
    <View>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-6">
        {fragment.amountLabel}
      </Text>

      <Text size="sm" tone="subtle" className="mt-1">
        {fragment.estimateNote}
      </Text>

      <Text size="sm" tone="muted" numeric className="mt-3">
        {fragment.subtitle}
      </Text>

      <View className="mt-8">
        <ListRow
          testID="stats-payroll-history"
          title={PAYROLL_VIEW_COPY.historyRow}
          chevron
          onPress={onOpenHistory}
        />
      </View>
    </View>
  );
}
