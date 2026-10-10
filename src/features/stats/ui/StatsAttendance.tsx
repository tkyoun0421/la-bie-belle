import type { ReactNode } from "react";
import { View } from "react-native";
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

  if (fragment.state === "pending") {
    return pending;
  }

  if (fragment.state === "failed") {
    return failed;
  }

  if (fragment.state === "empty") {
    return empty;
  }

  return (
    <View>
      <Text size="sm" tone="muted" numeric className="mt-6">
        {fragment.line}
      </Text>

      <View className="mt-3">
        <RatioBand testID="stats-attendance-legend" shares={fragment.shares} />
      </View>

      <View className="mt-8">
        {fragment.rows.map((row, at) => (
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
  );
}
