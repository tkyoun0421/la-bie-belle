import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { useUnreadCountLine } from "@/entities/notification/hooks/useUnreadCountLine";

export function UnreadCountLine() {
  const fragment = useUnreadCountLine();

  return (
    <View className="px-6 pt-2">
      <Text size="xs" weight="medium" tone="subtle">
        {fragment.line}
      </Text>
    </View>
  );
}
