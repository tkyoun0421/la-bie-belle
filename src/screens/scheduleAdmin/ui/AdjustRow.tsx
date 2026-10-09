import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import type { AdjustSheetRowView } from "@/screens/scheduleAdmin/model/adjustSheet.type";

export type AdjustRowProps = {
  row: AdjustSheetRowView;
};

export function AdjustRow({ row }: AdjustRowProps) {
  return (
    <View>
      <ListRow
        title={row.name}
        accessibilityLabel={row.accessibilityLabel}
        className={row.rehearsalLine === null ? undefined : "pb-1"}
        divider={row.divider}
        chevron
        right={
          <View className="flex-row items-baseline gap-1">
            {row.kindLabel === null ? null : (
              <Text size="sm" tone="subtle">
                {row.kindLabel}
              </Text>
            )}
            <Text size="sm" weight="medium" numeric>
              {row.hoursLabel}
            </Text>
          </View>
        }
        onPress={row.press}
      />
      {row.rehearsalLine === null ? null : (
        <Text size="xs" tone="muted" numeric className="pb-3">
          {row.rehearsalLine}
        </Text>
      )}
    </View>
  );
}
