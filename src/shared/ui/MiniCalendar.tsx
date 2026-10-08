import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";
import { miniCalendarGrid } from "@/shared/utils/miniCalendar";

const CELL_SIZE = 20;

const ROW_GAP = 10;

const MARK_DOT_SIZE = 4;

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export type MiniCalendarDay = {
  marked?: boolean;
  load?: number;
};

export type MiniCalendarProps = {
  year: number;
  month: number;
  today?: Date | null;
  days?: Record<number, MiniCalendarDay>;
  testID?: string;
};

export function MiniCalendar({
  year,
  month,
  today = null,
  days = {},
  testID,
}: MiniCalendarProps) {
  const todayDay = dayOfToday(year, month, today);

  return (
    <View testID={testID} style={{ rowGap: ROW_GAP }}>
      <View className="flex-row">
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} className="flex-1 items-center">
            <Text className="text-xs text-fg-neutral-subtle">{weekday}</Text>
          </View>
        ))}
      </View>

      {miniCalendarGrid(year, month).map((week, index) => (
        <View key={`week-${index}`} className="flex-row">
          {week.map((day, column) => (
            <View
              key={day ?? `empty-${column}`}
              className="flex-1 items-center"
            >
              {day === null ? null : (
                <DayCell
                  day={day}
                  isToday={day === todayDay}
                  mark={days[day]}
                />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function DayCell({
  day,
  isToday,
  mark,
}: {
  day: number;
  isToday: boolean;
  mark?: MiniCalendarDay;
}) {
  const load = mark?.load ?? 0;

  return (
    <View
      className={cn(
        "items-center justify-center",
        isToday ? "rounded-full bg-bg-neutral-solid" : "rounded-xs",
        !isToday && load > 0 ? "bg-bg-brand-weak" : undefined,
      )}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      {isToday || load <= 0 ? null : (
        <View
          className="absolute inset-0 rounded-xs bg-bg-brand-solid"
          style={{ opacity: Math.min(1, load) }}
        />
      )}
      <Text
        className={cn(
          "text-xs tabular-nums",
          isToday ? "text-fg-neutral-contrast" : "text-fg-neutral-subtle",
        )}
      >
        {day}
      </Text>
      {mark?.marked === true && !isToday ? (
        <View
          className="absolute rounded-full bg-bg-brand-solid"
          style={{
            width: MARK_DOT_SIZE,
            height: MARK_DOT_SIZE,
            bottom: 1,
          }}
        />
      ) : null}
    </View>
  );
}

function dayOfToday(
  year: number,
  month: number,
  today: Date | null,
): number | null {
  if (today === null) {
    return null;
  }

  const sameMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  return sameMonth ? today.getDate() : null;
}
