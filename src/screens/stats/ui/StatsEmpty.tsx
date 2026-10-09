import { View } from "react-native";
import { NO_VALUE } from "@/shared/consts/noValue.const";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Text } from "@/shared/ui/Text";
import { STATS_COPY } from "@/screens/stats/consts/stats.const";

export function StatsEmpty() {
  return (
    <View>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-6">
        {NO_VALUE}
      </Text>

      <View className="mt-8">
        <EmptyState
          scene="no-shifts"
          title={STATS_COPY.emptyTitle}
          description={STATS_COPY.emptyBody}
        />
      </View>
    </View>
  );
}
