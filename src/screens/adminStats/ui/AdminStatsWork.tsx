import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { ListRow } from "@/shared/ui/ListRow";
import { RowBars } from "@/shared/ui/RowBars";
import { Text } from "@/shared/ui/Text";
import {
  ADMIN_STATS_COPY,
  AVATAR_SIZE,
} from "@/screens/adminStats/consts/adminStats.const";
import type {
  AdminStatsPersonRow,
  AdminStatsPositionRow,
} from "@/screens/adminStats/hooks/useAdminStatsScreen";

export type AdminStatsWorkProps = {
  totalLabel: string;
  countLine: string;
  peopleRows: AdminStatsPersonRow[];
  positionRows: AdminStatsPositionRow[];
};

function SectionHeader({ label }: { label: string }) {
  return (
    <View className="mt-8">
      <Divider />
      <View className="py-2">
        <Text size="xs" weight="medium" tone="subtle">
          {label}
        </Text>
      </View>
    </View>
  );
}

export function AdminStatsWork({
  totalLabel,
  countLine,
  peopleRows,
  positionRows,
}: AdminStatsWorkProps) {
  return (
    <View>
      <Text size="3xl" weight="bold" numeric className="mt-6">
        {totalLabel}
      </Text>

      <Text size="sm" tone="muted" numeric className="mt-3">
        {countLine}
      </Text>

      <SectionHeader label={ADMIN_STATS_COPY.peopleSection} />
      <RowBars
        testID="stats-people"
        items={peopleRows.map((row) => ({
          key: row.key,
          value: row.weight,
          row: (
            <ListRow
              testID={`stats-person-${row.profileId}`}
              left={<Avatar name={row.displayName} size={AVATAR_SIZE} />}
              title={row.displayName}
              detail={row.detail}
              value={row.value}
              valueTone="answer"
              chevron
              onPress={row.press}
            />
          ),
        }))}
      />

      <SectionHeader label={ADMIN_STATS_COPY.positionSection} />
      <RowBars
        testID="stats-positions"
        items={positionRows.map((row) => ({
          key: row.key,
          value: row.weight,
          row: (
            <ListRow
              title={row.title}
              detail={row.detail}
              value={row.value}
              valueTone={row.valueTone}
            />
          ),
        }))}
      />
    </View>
  );
}
