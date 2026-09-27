import { Check } from "lucide-react-native";
import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 켜고 끄는 상자 하나에 글자 라벨이 붙는다. 정본은
 * `docs/2-design/design-system/components.md`의 「체크박스」다.
 *
 * **[스위치](Switch.tsx)와 자리가 다르다.** 스위치는 설정 줄의 오른쪽 끝에 서서 저장 없이
 * 바로 적용되는 설정이고, 이 조각은 지금 보는 것을 거르는 손잡이라 라벨을 제 옆에 달고
 * 본문 위에 선다. 근무표의 「내 근무만」이 첫 자리다.
 *
 * **켬이 브랜드 색이다.** 스위치와 갈리는 자리다 — 체크박스는 목록 줄마다 서는 것이 아니라
 * 화면에 하나둘이고, 지금 걸러 보는 중이라는 것이 한눈에 보여야 한다.
 *
 * 상자는 18px 그대로 두고 `hitSlop`이 사방을 받아 닿는 면을 넓힌다. 라벨도 같이 눌린다 —
 * 상자만 눌리게 하면 손가락이 18px 과녁을 맞혀야 한다.
 */

const BOX_SIZE = 18;

const CHECK_ICON_SIZE = 12;

const HIT_SLOP = 12;

export type CheckboxProps = Omit<PressableProps, "onPress" | "children"> & {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  testID?: string;
};

export function Checkbox({
  label,
  checked,
  onCheckedChange,
  className,
  testID,
  ...rest
}: CheckboxProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={() => onCheckedChange(!checked)}
      className={cn("flex-row items-center gap-2", className)}
      {...rest}
    >
      <View
        style={{ width: BOX_SIZE, height: BOX_SIZE }}
        className={cn(
          "items-center justify-center rounded-xs border",
          checked
            ? "border-stroke-brand-solid bg-bg-brand-solid"
            : "border-stroke-neutral-muted bg-bg-neutral",
        )}
      >
        {checked ? (
          <Icon
            icon={Check}
            size={CHECK_ICON_SIZE}
            className="text-fg-neutral-contrast"
          />
        ) : null}
      </View>
      <Text size="sm" tone={checked ? "neutral" : "subtle"}>
        {label}
      </Text>
    </Pressable>
  );
}
