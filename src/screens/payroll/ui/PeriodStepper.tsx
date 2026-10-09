import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import {
  NEXT_PERIOD_TEST_ID,
  PREV_PERIOD_TEST_ID,
} from "@/screens/payroll/consts/payroll.const";

export type PeriodStepperProps = {
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function PeriodStepper({
  label,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: PeriodStepperProps) {
  return (
    <View className="mt-5 flex-row items-center justify-center gap-2 py-2">
      {canGoPrev ? (
        <Button
          variant="ghost"
          size="compact"
          square
          testID={PREV_PERIOD_TEST_ID}
          onPress={onPrev}
        >
          <Icon icon={ChevronLeft} tone="subtle" />
        </Button>
      ) : (
        <ArrowSlot />
      )}

      <Text size="base" weight="medium" numeric>
        {label}
      </Text>

      {canGoNext ? (
        <Button
          variant="ghost"
          size="compact"
          square
          testID={NEXT_PERIOD_TEST_ID}
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
