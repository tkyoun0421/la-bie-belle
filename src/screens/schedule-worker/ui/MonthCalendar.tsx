import { View } from "react-native";
import { miniCalendarGrid } from "@/shared/lib/mini-calendar";
import {
  ScheduleDayCell,
  type ScheduleDayCellState,
} from "@/shared/ui/ScheduleDayCell";
import { Text } from "@/shared/ui/Text";

/**
 * 한 달 달력이다. 확정된 달의 조회와 확정 전의 제출 모드가 같은 그리드를 쓴다 — 갈리는 것은
 * 칸의 상태와 누를 수 있는지뿐이다
 * (`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「확정 전 — 근무 신청」).
 *
 * 주가 월요일에 시작하고 이 달 밖 칸을 비우는 계산은 `@/shared/lib/mini-calendar`가 소유한다 —
 * 미니 달력과 큰 달력이 같은 격자를 쓴다.
 */

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export type MonthCalendarProps = {
  month: string;
  stateOf: (date: string) => ScheduleDayCellState;
  isToday: (date: string) => boolean;
  onPressDay?: (date: string) => void;
  canPress: (date: string) => boolean;
};

export function MonthCalendar({
  month,
  stateOf,
  isToday,
  onPressDay,
  canPress,
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
