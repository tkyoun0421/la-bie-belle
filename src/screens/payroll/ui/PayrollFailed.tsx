import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_COPY } from "@/screens/payroll/consts/payroll.const";

export type PayrollFailedProps = {
  onRetry: () => void;
};

export function PayrollFailed({ onRetry }: PayrollFailedProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Text size="xs" tone="subtle">
        {PAYROLL_COPY.readFailed}
      </Text>
      <Button variant="ghost" size="compact" onPress={onRetry}>
        {PAYROLL_COPY.retry}
      </Button>
    </View>
  );
}
