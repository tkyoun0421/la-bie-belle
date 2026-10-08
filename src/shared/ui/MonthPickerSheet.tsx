import { Check, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";
import { buildYearMonths, shiftYear } from "@/shared/utils/monthPicker";

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
