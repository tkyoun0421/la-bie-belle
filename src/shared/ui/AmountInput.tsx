import { TextInput, View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type AmountInputProps = {
  value: string;
  unit?: string;
  hint?: string;
  onChangeText: (text: string) => void;
  testID?: string;
  className?: string;
};

export function AmountInput({
  value,
  unit = "원",
  hint,
  onChangeText,
  testID,
  className,
}: AmountInputProps) {
  return (
    <View className={cn("gap-2", className)}>
      <View className="flex-row items-center justify-end rounded-md border border-stroke-neutral bg-bg-neutral-weak p-4">
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          accessibilityLabel={`${value}${unit}`}
          className="flex-1 text-right font-semibold text-2xl text-fg-neutral tabular-nums"
        />
        <Text className="font-semibold text-2xl text-fg-neutral">{unit}</Text>
      </View>
      {hint ? (
        <Text className="text-xs text-fg-neutral-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
