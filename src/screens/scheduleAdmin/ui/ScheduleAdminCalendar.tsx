import { ScrollView, View } from "react-native";
import { Screen } from "@/shared/ui/Screen";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import { ScheduleAdminBottomCta } from "@/screens/scheduleAdmin/ui/ScheduleAdminBottomCta";
import { ScheduleAdminSheets } from "@/screens/scheduleAdmin/ui/ScheduleAdminSheets";
import { ScheduleAdminToast } from "@/screens/scheduleAdmin/ui/ScheduleAdminToast";
import { ScheduleCalendarLoading } from "@/screens/scheduleAdmin/ui/ScheduleCalendarLoading";
import { ScheduleCalendarMissing } from "@/screens/scheduleAdmin/ui/ScheduleCalendarMissing";
import { ScheduleCalendarMonth } from "@/screens/scheduleAdmin/ui/ScheduleCalendarMonth";
import { ScheduleMonthAppBar } from "@/screens/scheduleAdmin/ui/ScheduleMonthAppBar";
import { SchedulePickingAppBar } from "@/screens/scheduleAdmin/ui/SchedulePickingAppBar";

export type ScheduleAdminCalendarProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleAdminCalendar({ screen }: ScheduleAdminCalendarProps) {
  return (
    <Screen>
      {screen.picking ? (
        <SchedulePickingAppBar onStop={screen.stopPicking} />
      ) : (
        <ScheduleMonthAppBar screen={screen} />
      )}

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {screen.listState === "loading" ? (
            <ScheduleCalendarLoading />
          ) : screen.listState === "missing" ? (
            <ScheduleCalendarMissing screen={screen} />
          ) : (
            <ScheduleCalendarMonth screen={screen} />
          )}
        </View>
      </ScrollView>

      <ScheduleAdminBottomCta screen={screen} />

      <ScheduleAdminSheets screen={screen} />

      <ScheduleAdminToast screen={screen} />
    </Screen>
  );
}
