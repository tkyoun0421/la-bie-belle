import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { ADMIN_STATS_COPY } from "@/screens/adminStats/consts/adminStats.const";

export type AdminStatsFailedProps = {
  onRetry: () => void;
};

export function AdminStatsFailed({ onRetry }: AdminStatsFailedProps) {
  return (
    <View className="mt-6 flex-row items-center gap-2">
      <Text size="xs" tone="subtle">
        {ADMIN_STATS_COPY.readFailed}
      </Text>
      <Button variant="ghost" size="compact" onPress={onRetry}>
        {ADMIN_STATS_COPY.retry}
      </Button>
    </View>
  );
}
