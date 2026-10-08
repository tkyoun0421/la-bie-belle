import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/utils/cn";

export function Divider({ className, ...rest }: ViewProps) {
  return (
    <View
      accessibilityRole="none"
      className={cn("h-px bg-stroke-neutral", className)}
      {...rest}
    />
  );
}
