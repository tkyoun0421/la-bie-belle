import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { NOTIFICATIONS_COPY } from "@/screens/notifications/consts/notifications.const";

export function NotificationsEmpty() {
  return (
    <View className="mt-4 px-6 py-4">
      <Text weight="medium">{NOTIFICATIONS_COPY.emptyTitle}</Text>
      <Text size="sm" tone="subtle" className="mt-0.5">
        {NOTIFICATIONS_COPY.emptyBody}
      </Text>
    </View>
  );
}
