import { TextInput, View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

/**
 * 금액을 받는 칸이다. 시급 두 시트가 이 하나를 같이 쓰고, 뒤에 오는 금액 칸도 같은 것을
 * 쓴다(plan payroll-wages 「변경 파일」).
 *
 * **「원」이 숫자 바로 뒤에 붙고 둘이 한 덩이로 오른쪽에 선다.** 떨어뜨리면 `12,000`과
 * `원`이 다른 것 둘로 읽히고, 목록과 이력에서는 `12,000원`으로 붙어 있어 한 화면에서 같은
 * 값이 두 모양으로 선다(wages.md 「시급 문안」). 덩이가 오른쪽인 것은 금액이 오른쪽으로
 * 자라기 때문이다 — 왼쪽에 붙이면 자릿수가 늘 때마다 「원」이 밀려 글자가 자리를 옮긴다.
 *
 * **읽어 주는 이름도 한 덩이다.** 칸과 단위가 그리는 자리에서만 붙어 있으면 화면 낭독기와
 * 화면 밖에서 이 칸을 찾는 손에는 여전히 둘이라, 붙인 꼴을 `accessibilityLabel`로 같이
 * 싣는다.
 *
 * **쉼표와 상한은 이 조각이 안 센다.** 받은 글자를 그대로 그리고 친 것을 그대로 올린다 —
 * 무엇이 상한이고 무엇이 저장 가능한지는 부르는 쪽의 순수 함수가 든다(ADR-001).
 */

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
