import type { ReactNode } from "react";
import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { RowBars } from "@/shared/ui/RowBars";
import { Text } from "@/shared/ui/Text";
import { useStatsPositions } from "@/features/stats/hooks/useStatsPositions";

export type StatsPositionsProps = {
  month: string;
  loading: ReactNode;
  failed: ReactNode;
  empty: ReactNode;
};

export function StatsPositions({
  month,
  loading,
  failed,
  empty,
}: StatsPositionsProps) {
  const fragment = useStatsPositions(month);

  if (fragment.state === "loading") {
    return loading;
  }

  if (fragment.state === "failed") {
    return failed;
  }

  if (fragment.state === "empty") {
    return empty;
  }

  return (
    <View>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-6">
        {fragment.totalLabel}
      </Text>

      <View className="mt-8">
        <RowBars
          testID="stats-positions"
          items={fragment.rows.map((row) => ({
            key: row.key,
            value: row.weight,
            row: (
              <ListRow
                title={row.title}
                detail={row.detail}
                value={row.value}
              />
            ),
          }))}
        />
      </View>
    </View>
  );
}
