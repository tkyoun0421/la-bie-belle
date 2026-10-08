import { Check } from "lucide-react-native";
import { Pressable, View, type PressableProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const BOX_SIZE = 18;

const CHECK_ICON_SIZE = 12;

const HIT_SLOP = 12;

export type CheckboxProps = Omit<PressableProps, "onPress" | "children"> & {
  label: string;
  labelHidden?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  testID?: string;
};

export function Checkbox({
  label,
  labelHidden = false,
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
      {labelHidden ? null : (
        <Text size="sm" tone={checked ? "neutral" : "subtle"}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
