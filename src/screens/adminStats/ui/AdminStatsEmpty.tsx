import { View } from "react-native";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Text } from "@/shared/ui/Text";
import { ADMIN_STATS_COPY } from "@/screens/adminStats/consts/adminStats.const";

export type AdminStatsEmptyProps = {
  total: string | null;
};

export function AdminStatsEmpty({ total }: AdminStatsEmptyProps) {
  return (
    <View>
      {total === null ? null : (
        <Text size="3xl" weight="bold" numeric className="mt-6">
          {total}
        </Text>
      )}

      <View className="mt-8">
        <EmptyState
          scene="no-schedule"
          title={ADMIN_STATS_COPY.emptyTitle}
          description={ADMIN_STATS_COPY.emptyBody}
        />
      </View>
    </View>
  );
}
