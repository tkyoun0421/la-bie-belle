import { View } from "react-native";
import { Divider } from "@/shared/ui/Divider";
import { Text } from "@/shared/ui/Text";

export type WorkDaysSheetRow = {
  key: string;
  title: string;
  value: string;
};

export type WorkDaysSheetProps = {
  name: string;
  rows: WorkDaysSheetRow[];
  total: string;
};

export function WorkDaysSheet({ name, rows, total }: WorkDaysSheetProps) {
  return (
    <View>
      <Text size="lg" weight="semibold">
        {name}
      </Text>

      <View className="mt-4">
        {rows.map((row) => (
          <View
            key={row.key}
            className="flex-row items-center justify-between py-3"
          >
            <Text size="sm" tone="muted">
              {row.title}
            </Text>
            <Text size="sm" numeric>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Divider className="mt-2" />

      <Text size="base" weight="medium" numeric className="mt-3">
        {total}
      </Text>
    </View>
  );
}
