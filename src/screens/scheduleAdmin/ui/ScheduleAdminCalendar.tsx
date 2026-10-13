import { ScrollView, View } from "react-native";
import { FragmentView } from "@/shared/ui/FragmentView";
import { Screen } from "@/shared/ui/Screen";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { SKELETON_ROWS } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import { ScheduleAdminBottomCta } from "@/screens/scheduleAdmin/ui/ScheduleAdminBottomCta";
import { ScheduleAdminSheets } from "@/screens/scheduleAdmin/ui/ScheduleAdminSheets";
import { ScheduleAdminToast } from "@/screens/scheduleAdmin/ui/ScheduleAdminToast";
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
          <FragmentView
            fragment={screen.listState}
            pending={<SkeletonRows rows={SKELETON_ROWS} frame="card" />}
            empty={<ScheduleCalendarMissing screen={screen} />}
          >
            {() => <ScheduleCalendarMonth screen={screen} />}
          </FragmentView>
        </View>
      </ScrollView>

      <ScheduleAdminBottomCta screen={screen} />

      <ScheduleAdminSheets screen={screen} />

      <ScheduleAdminToast screen={screen} />
    </Screen>
  );
}
