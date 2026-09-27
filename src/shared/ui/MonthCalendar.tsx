import { View } from "react-native";
import { miniCalendarGrid } from "@/shared/lib/mini-calendar";
import {
  ScheduleDayCell,
  type ScheduleDayCellState,
} from "@/shared/ui/ScheduleDayCell";
import { Text } from "@/shared/ui/Text";

/**
 * 한 달 달력이다. 근무자 조회와 제출 모드, 관리자 편집과 날 열기 모드가 같은 그리드를 쓴다 —
 * 갈리는 것은 칸의 상태와 누를 수 있는지와 칸 바닥의 표식뿐이다. 정본은
 * `docs/2-design/design-system/components.md`의 「월 달력」과 「근무표 날짜 칸」이다.
 *
 * **두 슬라이스가 쓰므로 조각도 공용이다.** 근무자 화면이 먼저 세웠지만 관리자 화면이 같은
 * 격자를 쓰게 되면서 `src/shared/ui`로 올렸다 — 슬라이스끼리는 서로를 못 부른다.
 *
 * 주가 월요일에 시작하고 이 달 밖 칸을 비우는 계산은 `@/shared/lib/mini-calendar`가 소유한다 —
 * 미니 달력과 큰 달력이 같은 격자를 쓴다.
 *
 * 칸 바닥의 신청 수와 빈 자리 수는 부르는 쪽이 준다. 무엇을 셀지는 달의 상태가 정하는데 그
 * 판정이 화면마다 갈려서다. `noteOf`가 내는 짧은 글도 같은 자리고 세 번째 화면인 리허설이
 * 그 자리에 시간을 적는다.
 */

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
