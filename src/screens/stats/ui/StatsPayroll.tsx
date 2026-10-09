import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { STATS_COPY } from "@/screens/stats/consts/stats.const";

export type StatsPayrollProps = {
  amountLabel: string;
  estimateNote: string;
  subtitle: string;
  onOpenHistory: () => void;
};

export function StatsPayroll({
  amountLabel,
  estimateNote,
  subtitle,
  onOpenHistory,
}: StatsPayrollProps) {
  return (
    <View>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-6">
        {amountLabel}
      </Text>

      <Text size="sm" tone="subtle" className="mt-1">
        {estimateNote}
      </Text>

      <Text size="sm" tone="muted" numeric className="mt-3">
        {subtitle}
      </Text>

      <View className="mt-8">
        <ListRow
          testID="stats-payroll-history"
          title={STATS_COPY.historyRow}
          chevron
          onPress={onOpenHistory}
        />
      </View>
    </View>
  );
}
