import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";

export type NotificationsFailedProps = {
  onRetry: () => void;
};

export function NotificationsFailed({ onRetry }: NotificationsFailedProps) {
  return (
    <View className="mt-4 items-center gap-3">
      <Text size="sm" tone="muted">
        {NOTIFICATIONS_COPY.readFailed}
      </Text>
      <Button variant="ghost" size="compact" onPress={onRetry}>
        {NOTIFICATIONS_COPY.retry}
      </Button>
    </View>
  );
}
