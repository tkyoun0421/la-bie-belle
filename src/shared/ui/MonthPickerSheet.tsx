import { Check, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { buildYearMonths, shiftYear } from "@/shared/lib/monthPicker";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";

/**
 * 달을 고르는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「달 고르기 시트 짜임」이고
 * 값은 `docs/2-design/design-system/components.md`의 「달 고르기 시트」가 든다.
 *
 * **제목이 곧 문이라 화면마다 같은 시트가 열린다.** 근무표·급여·리허설이 달을 오가는 손짓이
 * 같아서 조각도 하나다 — 화살표만 두면 먼 달로 가는 데 여러 번 눌러야 하고, 무제한으로
 * 거슬러 보는 화면에서 그 거리는 끝이 없다.
 *
 * **CTA가 없다.** 달을 누르면 바로 닫히고 그 달로 간다 — 고르는 것이 곧 이동이라 확인을 한
 * 번 더 받을 것이 없다.
 *
 * **오늘이 든 달을 따로 표시하지 않는다.** 이 시트가 말하는 것은 어디로 갈지 하나고, 지금이
 * 몇 월인지는 화면이 알려줄 것이 아니다.
 *
 * `dimmedMonths`는 그 화면에서 아직 아무것도 없는 달이다 — 근무표를 안 만든 달이 그
 * 자리고 흐리기만 할 뿐 눌리기는 한다. 리허설처럼 흐릴 달이 없는 화면은 안 준다.
 *
 * 연도 줄에도 열람 제한이 없다. 입사 이전 해로 넘어가면 열두 칸이 전부 흐리다.
 */

const MONTHS_PER_ROW = 4;

export type MonthPickerSheetProps = {
  year: number;
  selectedMonth: string;
  dimmedMonths?: readonly string[];
  onPick: (month: string) => void;
  onYearChange: (year: number) => void;
  onDismiss: () => void;
};

export function MonthPickerSheet({
  year,
  selectedMonth,
  dimmedMonths = [],
  onPick,
  onYearChange,
  onDismiss,
}: MonthPickerSheetProps) {
  const cells = buildYearMonths(year, selectedMonth);
  const rows = Array.from(
    { length: cells.length / MONTHS_PER_ROW },
    (_unused, at) =>
      cells.slice(at * MONTHS_PER_ROW, (at + 1) * MONTHS_PER_ROW),
  );

  return (
    <SheetLayer onDismiss={onDismiss}>
      <Text size="lg" weight="semibold">
        달 고르기
      </Text>

      <View className="mt-4 flex-row items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="compact"
          square
          testID="month-picker-year-prev"
          onPress={() => onYearChange(shiftYear(year, -1))}
        >
          <Icon icon={ChevronLeft} />
        </Button>
        <Text size="base" weight="medium" numeric>
          {`${year}년`}
        </Text>
        <Button
          variant="ghost"
          size="compact"
          square
          testID="month-picker-year-next"
          onPress={() => onYearChange(shiftYear(year, 1))}
        >
          <Icon icon={ChevronRight} />
        </Button>
      </View>

      <View className="mt-4 gap-2">
        {rows.map((row) => (
          <View key={row[0].month} className="flex-row gap-2">
            {row.map((cell) => (
              <MonthCell
                key={cell.month}
                label={cell.label}
                selected={cell.selected}
                dimmed={dimmedMonths.includes(cell.month)}
                onPress={() => onPick(cell.month)}
              />
            ))}
          </View>
        ))}
      </View>
    </SheetLayer>
  );
}

const CHECK_ICON_SIZE = 12;

function MonthCell({
  label,
  selected,
  dimmed,
  onPress,
}: {
  label: string;
  selected: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={`month-picker-${label}`}
      onPress={onPress}
      className={cn(
        "h-12 flex-1 items-center justify-center gap-0.5 rounded-sm",
        selected &&
          "border border-stroke-brand-solid bg-bg-brand-weak-selected",
      )}
    >
      <Text size="sm" tone={dimmed && !selected ? "subtle" : "neutral"}>
        {label}
      </Text>
      {selected ? (
        <Icon icon={Check} size={CHECK_ICON_SIZE} className="text-fg-brand" />
      ) : null}
    </Pressable>
  );
}
