import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { Text } from "@/shared/ui/Text";
import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import {
  APPLICATIONS_COPY,
  TAB_OPTIONS,
} from "@/screens/applications/consts/applications.const";
import { useApplicationsScreen } from "@/screens/applications/hooks/useApplicationsScreen";

const SKELETON_ROWS = [0, 1, 2];

export type ApplicationsScreenProps = {
  month?: string;
};

export function ApplicationsScreen({ month }: ApplicationsScreenProps) {
  const router = useRouter();
  const screen = useApplicationsScreen(month);

  return (
    <Screen>
      <AppBar title={screen.title} onBack={() => router.back()} />

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {screen.deadlineLine === null ? null : (
            <View className="flex-row items-center gap-2">
              <Text size="xs" tone="subtle" numeric>
                {screen.deadlineLine}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={screen.openDeadline}
              >
                <Text size="xs" tone="muted">
                  {APPLICATIONS_COPY.changeDeadline}
                </Text>
              </Pressable>
            </View>
          )}

          <Tabs
            items={TAB_OPTIONS}
            value={screen.tab}
            onChange={screen.chooseTab}
          />

          {screen.listState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.listState === "empty" ? (
            <View className="gap-1 py-6">
              <Text size="sm" tone="muted">
                {APPLICATIONS_COPY.empty}
              </Text>
              {screen.emptyDeadlineLine === null ? null : (
                <Text size="sm" tone="muted" numeric>
                  {screen.emptyDeadlineLine}
                </Text>
              )}
            </View>
          ) : screen.listState === "date" ? (
            screen.dateGroups.map((group) => (
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
            ))
          ) : (
            screen.personGroups.map((group) => (
              <View key={group.key} className="gap-1">
                <Card className="py-0">
                  <ListRow
                    title={group.displayName}
                    detail={group.dates}
                    chevron={false}
                  />
                </Card>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {screen.sheet ? (
        <SheetLayer onDismiss={screen.closeDeadline}>
          <DeadlineSheet
            deadline={screen.sheet.deadline}
            today={screen.sheet.today}
            saving={screen.saving}
            failed={screen.failed}
            onClose={screen.closeDeadline}
            onSave={screen.saveDeadline}
          />
        </SheetLayer>
      ) : null}
    </Screen>
  );
}
