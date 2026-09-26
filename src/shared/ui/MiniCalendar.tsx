import { View } from "react-native";
import { miniCalendarGrid } from "@/shared/lib/mini-calendar";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 한 달을 작은 칸으로 줄여 날마다 점이나 면을 찍는다. 정본은
 * `docs/2-design/design-system/components.md`의 「미니 달력」이고, 열 나눔과 줄 사이는
 * `docs/2-design/spec/ui-kit.md`의 「미니 달력의 새 값」이 그 표를 고친 값이다.
 *
 * **주는 월요일에 시작한다** — 큰 달력과 같다. 줄 수가 달마다 달라 높이가 바뀌는 것도 그
 * 격자가 정하고, 계산은 `@/shared/lib/mini-calendar`가 소유한다.
 *
 * **칸은 20px 정사각 그대로고 일곱 열이 안쪽 폭을 같은 폭으로 나눈다.** 칸은 열 가운데에
 * 서므로 칸 사이 가로 간격은 담는 폭에 따라 달라지고, 줄 사이만 10px로 고정이다.
 *
 * **근무표 날짜 칸과 다른 조각이다.** 저쪽은 누르는 것이고 상태를 여럿으로 말한다. 이쪽은
 * 한 가지만 말하고 칸을 따로 안 누른다 — 달력 전체를 누르면 근무표로 간다.
 *
 * **오늘은 여기서도 형태로 말한다.** 큰 달력과 같은 검은 원이라 색 예산을 안 쓴다.
 *
 * 관리자 표식인 `load`는 0과 1 사이다. 0보다 크면 칸이 옅은 브랜드 면에서 시작해 1에서 꽉
 * 찬 브랜드 면으로 진해진다 — 사이 단계에 이름 붙은 토큰이 없어 두 면을 겹쳐 짙기를 낸다.
 */

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

/** 보는 달이 오늘이 든 달일 때만 원이 선다. */
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
