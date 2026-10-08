import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/utils/cn";

export type ScreenFloor = "sunken" | "plain";

const FLOORS: Record<ScreenFloor, string> = {
  sunken: "bg-bg-neutral-sunken",
  plain: "bg-bg-neutral",
};

export type ScreenProps = ViewProps & {
  floor?: ScreenFloor;
};

export function Screen({ floor = "sunken", className, ...rest }: ScreenProps) {
  return <View className={cn("flex-1", FLOORS[floor], className)} {...rest} />;
}
