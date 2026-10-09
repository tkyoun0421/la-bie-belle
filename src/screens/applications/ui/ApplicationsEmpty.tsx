import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { APPLICATIONS_COPY } from "@/screens/applications/consts/applications.const";

export type ApplicationsEmptyProps = {
  deadlineLine: string | null;
};

export function ApplicationsEmpty({ deadlineLine }: ApplicationsEmptyProps) {
  return (
    <View className="gap-1 py-6">
      <Text size="sm" tone="muted">
        {APPLICATIONS_COPY.empty}
      </Text>
      {deadlineLine === null ? null : (
        <Text size="sm" tone="muted" numeric>
          {deadlineLine}
        </Text>
      )}
    </View>
  );
}
