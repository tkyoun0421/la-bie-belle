import { View } from "react-native";
import {
  ScheduleDayCell,
  type ScheduleDayCellState,
} from "@/shared/ui/ScheduleDayCell";
import { Text } from "@/shared/ui/Text";
import { miniCalendarGrid } from "@/shared/utils/miniCalendar";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export type MonthCalendarProps = {
  month: string;
  stateOf: (date: string) => ScheduleDayCellState;
  isToday: (date: string) => boolean;
  onPressDay?: (date: string) => void;
  canPress: (date: string) => boolean;
  applicationCountOf?: (date: string) => number;
  vacancyCountOf?: (date: string) => number | null;
  noteOf?: (date: string) => string | null;
};

export function MonthCalendar({
  month,
  stateOf,
  isToday,
  onPressDay,
  canPress,
  applicationCountOf,
  vacancyCountOf,
  noteOf,
}: MonthCalendarProps) {
  const [year, index] = month.split("-").map(Number);

  return (
    <View className="gap-1">
      <View className="flex-row">
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} className="flex-1 items-center py-1">
            <Text size="xs" tone="subtle">
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      {miniCalendarGrid(year, index).map((week, at) => (
        <View key={`week-${at}`} className="flex-row gap-1">
          {week.map((day, column) => {
            const date =
              day === null ? null : `${month}-${String(day).padStart(2, "0")}`;

            return (
              <View key={day ?? `empty-${column}`} className="flex-1">
                <ScheduleDayCell
                  day={day}
                  testID={date === null ? undefined : `schedule-day-${date}`}
                  state={date === null ? "closed" : stateOf(date)}
                  isToday={date !== null && isToday(date)}
                  applicationCount={
                    date === null ? 0 : (applicationCountOf?.(date) ?? 0)
                  }
                  vacancyCount={
                    date === null ? null : (vacancyCountOf?.(date) ?? null)
                  }
                  note={date === null ? null : (noteOf?.(date) ?? null)}
                  onPress={
                    date !== null && onPressDay && canPress(date)
                      ? () => onPressDay(date)
                      : undefined
                  }
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
