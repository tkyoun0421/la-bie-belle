import { Pressable, View, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type TabItem = {
  value: string;
  label: string;
};

export type TabsProps = Omit<ViewProps, "children"> & {
  items: readonly TabItem[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
  testID,
  ...rest
}: TabsProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      className={cn("flex-row border-b border-stroke-neutral", className)}
      {...rest}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            testID={testID ? `${testID}-${item.value}` : undefined}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.value)}
            className={cn(
              "min-h-11 flex-1 items-center justify-center border-b-2 px-4",
              active ? "border-stroke-brand-solid" : "border-transparent",
            )}
          >
            <Text
              className={cn(
                "text-base",
                active ? "text-fg-brand" : "text-fg-neutral-subtle",
              )}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
