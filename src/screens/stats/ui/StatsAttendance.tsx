import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { RatioBand } from "@/shared/ui/RatioBand";
import { Text } from "@/shared/ui/Text";
import type { StatsRow } from "@/screens/stats/hooks/useStatsScreen";
import type { AttendanceShare } from "@/screens/stats/utils/attendanceShares.utils";

export type StatsAttendanceProps = {
  line: string;
  shares: AttendanceShare[];
  rows: readonly StatsRow[];
};

export function StatsAttendance({ line, shares, rows }: StatsAttendanceProps) {
  return (
    <View>
      <Text size="sm" tone="muted" numeric className="mt-6">
        {line}
      </Text>

      <View className="mt-3">
        <RatioBand testID="stats-attendance-legend" shares={shares} />
      </View>

      <View className="mt-8">
        {rows.map((row, at) => (
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
