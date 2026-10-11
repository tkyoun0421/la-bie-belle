import type { ReactNode } from "react";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { FragmentView } from "@/shared/ui/FragmentView";
import { ListRow } from "@/shared/ui/ListRow";
import { RowBars } from "@/shared/ui/RowBars";
import { Text } from "@/shared/ui/Text";
import { AVATAR_SIZE, STATS_COPY } from "@/features/stats/consts/stats.const";
import { useAdminStatsWork } from "@/features/stats/hooks/useAdminStatsWork";

export type AdminStatsWorkProps = {
  month: string;
  onPickPerson: (profileId: string) => void;
  pending: ReactNode;
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
  pending,
  failed,
  empty,
}: AdminStatsWorkProps) {
  const fragment = useAdminStatsWork(month);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) => (
        <View>
          <Text size="3xl" weight="bold" numeric className="mt-6">
            {ready.totalLabel}
          </Text>

          <Text size="sm" tone="muted" numeric className="mt-3">
            {ready.countLine}
          </Text>

          <SectionHeader label={STATS_COPY.peopleSection} />
          <RowBars
            testID="stats-people"
            items={ready.peopleRows.map((row) => ({
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
            items={ready.positionRows.map((row) => ({
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
      )}
    </FragmentView>
  );
}
