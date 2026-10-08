import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/utils/cn";

export type BottomSheetProps = ViewProps & {
  distance?: number;
  testID?: string;
};

export function BottomSheet({
  distance = 0,
  className,
  children,
  testID,
  style,
  ...rest
}: BottomSheetProps) {
  return (
    <View
      testID={testID}
      style={[style, { transform: [{ translateY: distance }] }]}
      className={cn(
        "w-full rounded-t-lg border-t border-stroke-neutral bg-bg-neutral p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

export function Scrim({ className, ...rest }: ViewProps) {
  return (
    <View className={cn("absolute inset-0 bg-bg-scrim", className)} {...rest} />
  );
}
