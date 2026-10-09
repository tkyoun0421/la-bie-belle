import type { ReactNode } from "react";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { ListRow } from "@/shared/ui/ListRow";
import { RowBars } from "@/shared/ui/RowBars";
import { Text } from "@/shared/ui/Text";
import { AVATAR_SIZE, STATS_COPY } from "@/features/stats/consts/stats.const";
import { useAdminStatsWork } from "@/features/stats/hooks/useAdminStatsWork";

export type AdminStatsWorkProps = {
  month: string;
  onPickPerson: (profileId: string) => void;
  loading: ReactNode;
  failed: ReactNode;
  empty: ReactNode;
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
  month,
  onPickPerson,
  loading,
  failed,
  empty,
}: AdminStatsWorkProps) {
  const fragment = useAdminStatsWork(month);

  if (fragment.state === "loading") {
    return loading;
  }

  if (fragment.state === "failed") {
    return failed;
  }

  if (fragment.state === "empty") {
    return empty;
  }

  return (
    <View>
      <Text size="3xl" weight="bold" numeric className="mt-6">
        {fragment.totalLabel}
      </Text>

      <Text size="sm" tone="muted" numeric className="mt-3">
        {fragment.countLine}
      </Text>

      <SectionHeader label={STATS_COPY.peopleSection} />
      <RowBars
        testID="stats-people"
        items={fragment.peopleRows.map((row) => ({
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
              onPress={() => onPickPerson(row.profileId)}
            />
          ),
        }))}
      />

      <SectionHeader label={STATS_COPY.positionSection} />
      <RowBars
        testID="stats-positions"
        items={fragment.positionRows.map((row) => ({
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
