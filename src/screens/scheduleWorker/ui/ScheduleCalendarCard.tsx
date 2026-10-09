import { Card } from "@/shared/ui/Card";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";

export type ScheduleCalendarCardProps = {
  month: string;
  stateOf: (date: string) => ScheduleDayCellState;
  isToday: (date: string) => boolean;
  canPress: (date: string) => boolean;
  onPressDay: ((date: string) => void) | undefined;
};

export function ScheduleCalendarCard({
  month,
  stateOf,
  isToday,
  canPress,
  onPressDay,
}: ScheduleCalendarCardProps) {
  return (
    <Card>
      <MonthCalendar
        month={month}
        stateOf={stateOf}
        isToday={isToday}
        canPress={canPress}
        onPressDay={onPressDay}
      />
    </Card>
  );
}
