import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import {
  adjustRowLabel,
  spellHours,
  type AdjustSheetRow,
} from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";

const HELP_LINE = "출근 인증이 없는 날은 급여에서 따로 빠져요";

const EMPTY_LINE = "아직 배정된 사람이 없어요";

export type AdjustSheetProps = {
  head: string;
  rows: readonly AdjustSheetRow[];
  onPickPerson: (profileId: string) => void;
};

export function AdjustSheet({ head, rows, onPickPerson }: AdjustSheetProps) {
  return (
    <View>
      <Text size="lg" weight="semibold">
        근무 조정
      </Text>

      <Text size="sm" tone="subtle" numeric className="mt-1">
        {head}
      </Text>

      {rows.length === 0 ? null : (
        <Text size="xs" tone="muted" className="mt-1">
          {HELP_LINE}
        </Text>
      )}

      {rows.length === 0 ? (
        <Text size="sm" tone="subtle" className="py-4">
          {EMPTY_LINE}
        </Text>
      ) : (
        <View className="mt-2">
          {rows.map((row, at) => (
            <View key={row.profileId}>
              <ListRow
                title={row.name}
                accessibilityLabel={adjustRowLabel(row)}
                className={row.rehearsalLine === null ? undefined : "pb-1"}
                divider={at > 0}
                chevron
                right={
                  <View className="flex-row items-baseline gap-1">
                    {row.adjustmentKind === null ? null : (
                      <Text size="sm" tone="subtle">
                        {row.adjustmentKind}
                      </Text>
                    )}
                    <Text size="sm" weight="medium" numeric>
                      {spellHours(row.finalMinutes)}
                    </Text>
                  </View>
                }
                onPress={() => onPickPerson(row.profileId)}
              />
              {row.rehearsalLine === null ? null : (
                <Text size="xs" tone="muted" numeric className="pb-3">
                  {row.rehearsalLine}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
