import { useScheduleAdminScreen } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import { ScheduleAdminCalendar } from "@/screens/scheduleAdmin/ui/ScheduleAdminCalendar";
import { ScheduleAdminDay } from "@/screens/scheduleAdmin/ui/ScheduleAdminDay";

export type ScheduleAdminScreenProps = {
  month?: string;
  date?: string;
  from?: string;
};

export function ScheduleAdminScreen({
  month,
  date,
  from,
}: ScheduleAdminScreenProps) {
  const screen = useScheduleAdminScreen({ month, date, from });

  if (screen.day !== null) {
    return <ScheduleAdminDay screen={screen} day={screen.day} />;
  }

  return <ScheduleAdminCalendar screen={screen} />;
}
