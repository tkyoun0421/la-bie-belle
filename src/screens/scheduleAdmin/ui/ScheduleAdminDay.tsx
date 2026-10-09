import { Screen } from "@/shared/ui/Screen";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import type { DayDetailInput } from "@/screens/scheduleAdmin/model/dayDetail.type";
import { DayDetail } from "@/screens/scheduleAdmin/ui/DayDetail";
import { ScheduleAdminSheets } from "@/screens/scheduleAdmin/ui/ScheduleAdminSheets";
import { ScheduleAdminToast } from "@/screens/scheduleAdmin/ui/ScheduleAdminToast";

export type ScheduleAdminDayProps = {
  screen: ScheduleAdminScreenController;
  day: DayDetailInput;
};

export function ScheduleAdminDay({ screen, day }: ScheduleAdminDayProps) {
  return (
    <Screen>
      <DayDetail {...day} onBack={screen.backFromDay} />

      <ScheduleAdminSheets screen={screen} />

      <ScheduleAdminToast screen={screen} />
    </Screen>
  );
}
