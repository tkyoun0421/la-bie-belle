import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { RowBars } from "@/shared/ui/RowBars";
import { Text } from "@/shared/ui/Text";
import type { StatsRow } from "@/screens/stats/hooks/useStatsScreen";

export type StatsPositionsProps = {
  totalLabel: string;
  rows: readonly StatsRow[];
};

export function StatsPositions({ totalLabel, rows }: StatsPositionsProps) {
  return (
    <View>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-6">
        {totalLabel}
      </Text>

      <View className="mt-8">
        <RowBars
          testID="stats-positions"
          items={rows.map((row) => ({
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
