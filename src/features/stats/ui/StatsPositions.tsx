import type { ReactNode } from "react";
import { View } from "react-native";
import { FragmentView } from "@/shared/ui/FragmentView";
import { ListRow } from "@/shared/ui/ListRow";
import { RowBars } from "@/shared/ui/RowBars";
import { Text } from "@/shared/ui/Text";
import { useStatsPositions } from "@/features/stats/hooks/useStatsPositions";

export type StatsPositionsProps = {
  month: string;
  pending: ReactNode;
  failed: ReactNode;
  empty: ReactNode;
};

export function StatsPositions({
  month,
  pending,
  failed,
  empty,
}: StatsPositionsProps) {
  const fragment = useStatsPositions(month);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) => (
        <View>
          <Text size="3xl" weight="bold" tone="brand" numeric className="mt-6">
            {ready.totalLabel}
          </Text>

          <View className="mt-8">
            <RowBars
              testID="stats-positions"
              items={ready.rows.map((row) => ({
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
      )}
    </FragmentView>
  );
}
