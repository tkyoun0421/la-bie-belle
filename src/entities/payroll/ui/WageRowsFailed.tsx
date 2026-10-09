import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { WAGE_ROWS_COPY } from "@/entities/payroll/consts/wageRows.const";

export function WageRowsFailed() {
  return (
    <View className="py-6">
      <Text size="sm" tone="subtle">
        {WAGE_ROWS_COPY.failed}
      </Text>
    </View>
  );
}
