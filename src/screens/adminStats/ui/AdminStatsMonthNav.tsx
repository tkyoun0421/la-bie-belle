import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

export type AdminStatsMonthNavProps = {
  monthLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function AdminStatsMonthNav({
  monthLabel,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: AdminStatsMonthNavProps) {
  return (
    <View className="mt-2 flex-row items-center justify-center gap-2 py-2">
      {canGoPrev ? (
        <Button
          variant="ghost"
          size="compact"
          square
          testID="stats-month-prev"
          onPress={onPrev}
        >
          <Icon icon={ChevronLeft} tone="subtle" />
        </Button>
      ) : (
        <ArrowSlot />
      )}

      <Text size="base" weight="medium" numeric>
        {monthLabel}
      </Text>

      {canGoNext ? (
        <Button
          variant="ghost"
          size="compact"
          square
          testID="stats-month-next"
          onPress={onNext}
        >
          <Icon icon={ChevronRight} tone="subtle" />
        </Button>
      ) : (
        <ArrowSlot />
      )}
    </View>
  );
}
