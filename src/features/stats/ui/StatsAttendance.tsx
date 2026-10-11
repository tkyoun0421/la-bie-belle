import type { ReactNode } from "react";
import { View } from "react-native";
import { FragmentView } from "@/shared/ui/FragmentView";
import { ListRow } from "@/shared/ui/ListRow";
import { RatioBand } from "@/shared/ui/RatioBand";
import { Text } from "@/shared/ui/Text";
import { useStatsAttendance } from "@/features/stats/hooks/useStatsAttendance";

export type StatsAttendanceProps = {
  month: string;
  pending: ReactNode;
  failed: ReactNode;
  empty: ReactNode;
};

export function StatsAttendance({
  month,
  pending,
  failed,
  empty,
}: StatsAttendanceProps) {
  const fragment = useStatsAttendance(month);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) => (
        <View>
          <Text size="sm" tone="muted" numeric className="mt-6">
            {ready.line}
          </Text>

          <View className="mt-3">
            <RatioBand testID="stats-attendance-legend" shares={ready.shares} />
          </View>

          <View className="mt-8">
            {ready.rows.map((row, at) => (
              <ListRow
                key={row.key}
                divider={at > 0}
                title={row.title}
                detail={row.detail}
                value={row.value}
              />
            ))}
          </View>
        </View>
      )}
    </FragmentView>
  );
}
