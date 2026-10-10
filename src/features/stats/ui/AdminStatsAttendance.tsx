import type { ReactNode } from "react";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { ListRow } from "@/shared/ui/ListRow";
import { RatioBand } from "@/shared/ui/RatioBand";
import { Text } from "@/shared/ui/Text";
import { AVATAR_SIZE } from "@/features/stats/consts/stats.const";
import { useAdminStatsAttendance } from "@/features/stats/hooks/useAdminStatsAttendance";

export type AdminStatsAttendanceProps = {
  month: string;
  pending: ReactNode;
  failed: ReactNode;
  empty: ReactNode;
};

export function AdminStatsAttendance({
  month,
  pending,
  failed,
  empty,
}: AdminStatsAttendanceProps) {
  const fragment = useAdminStatsAttendance(month);

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
            left={<Avatar name={row.displayName} size={AVATAR_SIZE} />}
            title={row.displayName}
            value={row.value}
          />
        ))}
      </View>
    </View>
  );
}
