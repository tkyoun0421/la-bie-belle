import { View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import type { ApplicationsPersonGroup } from "@/screens/applications/hooks/useApplicationsScreen";

export type ApplicationsPersonGroupsProps = {
  groups: readonly ApplicationsPersonGroup[];
};

export function ApplicationsPersonGroups({
  groups,
}: ApplicationsPersonGroupsProps) {
  return (
    <>
      {groups.map((group) => (
        <View key={group.key} className="gap-1">
          <Card className="py-0">
            <ListRow
              title={group.displayName}
              detail={group.dates}
              chevron={false}
            />
          </Card>
        </View>
      ))}
    </>
  );
}
