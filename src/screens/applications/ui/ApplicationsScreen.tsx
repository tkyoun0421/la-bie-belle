import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Screen } from "@/shared/ui/Screen";
import { Tabs } from "@/shared/ui/Tabs";
import { ApplicationsDeadlineBar } from "@/entities/availability/ui/ApplicationsDeadlineBar";
import { ApplicationsList } from "@/entities/availability/ui/ApplicationsList";
import { TAB_OPTIONS } from "@/screens/applications/consts/applications.const";
import { useApplicationsScreen } from "@/screens/applications/hooks/useApplicationsScreen";
import { ApplicationsEmpty } from "@/screens/applications/ui/ApplicationsEmpty";
import { ApplicationsLoading } from "@/screens/applications/ui/ApplicationsLoading";
import { ApplicationsSheets } from "@/screens/applications/ui/ApplicationsSheets";

export type ApplicationsScreenProps = {
  month?: string;
};

export function ApplicationsScreen({ month }: ApplicationsScreenProps) {
  const screen = useApplicationsScreen(month);

  return (
    <Screen>
      <AppBar title={screen.title} onBack={screen.goBack} />

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {screen.deadlineLine === null ? null : (
            <ApplicationsDeadlineBar
              line={screen.deadlineLine}
              onChange={screen.openDeadline}
            />
          )}

          <Tabs
            items={TAB_OPTIONS}
            value={screen.tab}
            onChange={screen.chooseTab}
          />

          <ApplicationsList
            month={screen.month}
            tab={screen.tab}
            loading={<ApplicationsLoading />}
            empty={
              <ApplicationsEmpty deadlineLine={screen.emptyDeadlineLine} />
            }
          />
        </View>
      </ScrollView>

      <ApplicationsSheets screen={screen} />
    </Screen>
  );
}
