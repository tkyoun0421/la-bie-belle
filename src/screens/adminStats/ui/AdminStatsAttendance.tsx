import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { ListRow } from "@/shared/ui/ListRow";
import { RatioBand } from "@/shared/ui/RatioBand";
import { Text } from "@/shared/ui/Text";
import { AVATAR_SIZE } from "@/screens/adminStats/consts/adminStats.const";
import type { AdminStatsAttendanceRow } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import type { AdminAttendanceShare } from "@/screens/adminStats/utils/attendanceLine.utils";

export type AdminStatsAttendanceProps = {
  attendanceLine: string;
  shares: AdminAttendanceShare[];
  rows: AdminStatsAttendanceRow[];
};

export function AdminStatsAttendance({
  attendanceLine,
  shares,
  rows,
}: AdminStatsAttendanceProps) {
  return (
    <View>
      <Text size="sm" tone="muted" numeric className="mt-6">
        {attendanceLine}
      </Text>

      <View className="mt-3">
        <RatioBand testID="stats-attendance-legend" shares={shares} />
      </View>

      <View className="mt-8">
        {rows.map((row, at) => (
          <ListRow
            key={row.key}
            divider={at > 0}
            left={<Avatar name={row.displayName} size={AVATAR_SIZE} />}
            title={row.displayName}
            value={row.value}
          />
        ))}
      </View>
    </View>
  );
}
