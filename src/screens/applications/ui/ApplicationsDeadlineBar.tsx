import { Pressable, View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { APPLICATIONS_COPY } from "@/screens/applications/consts/applications.const";

export type ApplicationsDeadlineBarProps = {
  line: string;
  onChange: () => void;
};

export function ApplicationsDeadlineBar({
  line,
  onChange,
}: ApplicationsDeadlineBarProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Text size="xs" tone="subtle" numeric>
        {line}
      </Text>
      <Pressable accessibilityRole="button" onPress={onChange}>
        <Text size="xs" tone="muted">
          {APPLICATIONS_COPY.changeDeadline}
        </Text>
      </Pressable>
    </View>
  );
}
