import { Pressable, View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_VIEW_COPY } from "@/features/payrollCompute/consts/payrollCompute.const";

export type PayrollViewFailedProps = {
  onRetry: () => void;
};

export function PayrollViewFailed({ onRetry }: PayrollViewFailedProps) {
  return (
    <View className="items-center gap-2 py-8">
      <Text size="sm" tone="subtle">
        {PAYROLL_VIEW_COPY.failed}
      </Text>

      <Pressable onPress={onRetry} hitSlop={8}>
        <Text size="sm" weight="medium">
          {PAYROLL_VIEW_COPY.retry}
        </Text>
      </Pressable>
    </View>
  );
}
