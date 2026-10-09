import { View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import type { ApplicationsDateGroup } from "@/entities/availability/hooks/useApplicationsList";

export type ApplicationsDateGroupsProps = {
  groups: readonly ApplicationsDateGroup[];
};

export function ApplicationsDateGroups({
  groups,
}: ApplicationsDateGroupsProps) {
  return (
    <>
      {groups.map((group) => (
        <View key={group.key} className="gap-1">
          <Text size="xs" tone="subtle" numeric>
            {group.heading}
          </Text>
          <Card className="py-0">
            {group.names.map((one) => (
              <ListRow key={one.key} title={one.name} chevron={false} />
            ))}
          </Card>
        </View>
      ))}
    </>
  );
}
