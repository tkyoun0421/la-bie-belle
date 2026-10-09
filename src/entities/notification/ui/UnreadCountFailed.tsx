import { Pressable, View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { UNREAD_COUNT_COPY } from "@/entities/notification/consts/unreadCount.const";

export type UnreadCountFailedProps = {
  onRetry: () => void;
};

export function UnreadCountFailed({ onRetry }: UnreadCountFailedProps) {
  return (
    <View className="flex-row items-center gap-2 px-6 pt-2">
      <Text size="xs" tone="subtle">
        {UNREAD_COUNT_COPY.failed}
      </Text>

      <Pressable onPress={onRetry} hitSlop={8}>
        <Text size="xs" weight="medium">
          {UNREAD_COUNT_COPY.retry}
        </Text>
      </Pressable>
    </View>
  );
}
