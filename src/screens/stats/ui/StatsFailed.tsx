import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { STATS_COPY } from "@/screens/stats/consts/stats.const";

export type StatsFailedProps = {
  onRetry: () => void;
};

export function StatsFailed({ onRetry }: StatsFailedProps) {
  return (
    <View className="mt-6 flex-row items-center gap-2">
      <Text size="xs" tone="subtle">
        {STATS_COPY.readFailed}
      </Text>
      <Button variant="ghost" size="compact" onPress={onRetry}>
        {STATS_COPY.retry}
      </Button>
    </View>
  );
}
