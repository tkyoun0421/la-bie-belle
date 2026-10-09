import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { UNREAD_COUNT_COPY } from "@/entities/notification/consts/unreadCount.const";

export function UnreadCountLoading() {
  return (
    <View className="px-6 pt-2">
      <Text size="xs" tone="subtle">
        {UNREAD_COUNT_COPY.loading}
      </Text>
    </View>
  );
}
