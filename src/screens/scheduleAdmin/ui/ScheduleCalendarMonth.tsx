import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";

export type ScheduleCalendarMonthProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleCalendarMonth({ screen }: ScheduleCalendarMonthProps) {
  return (
    <>
      {screen.picking ? (
        <Text size="xs" tone="subtle">
          {SCHEDULE_ADMIN_COPY.pickingHint}
        </Text>
      ) : screen.noticeLine === null ? null : (
        <Text size="xs" tone="subtle" numeric>
          {screen.noticeLine}
        </Text>
      )}

      {screen.showAllClosedHint ? (
        <Text size="sm" tone="muted">
          {SCHEDULE_ADMIN_COPY.allClosed}
        </Text>
      ) : null}

      <Card>
        <MonthCalendar
          month={screen.month}
          isToday={screen.calendar.isToday}
          stateOf={screen.calendar.stateOf}
          canPress={screen.calendar.canPress}
          onPressDay={screen.calendar.press}
          applicationCountOf={screen.calendar.applicationCountOf}
          vacancyCountOf={screen.calendar.vacancyCountOf}
        />
      </Card>

      {screen.showApplications ? (
        <>
          <Text size="xs" tone="subtle">
            {SCHEDULE_ADMIN_COPY.applicationsHint}
          </Text>

          <Card className="py-0">
            <ListRow
              title={screen.applicationsTitle}
              onPress={screen.openApplications}
            />
          </Card>
        </>
      ) : null}
    </>
  );
}
