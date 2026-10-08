import {
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, type PressableProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const SWITCH_ICON_SIZE = 20;

const SWITCH_HIT_SLOP = { left: 8, right: 8 };

export type AdminSwitchDestination = "admin" | "worker";

export type AdminSwitchProps = Omit<PressableProps, "children"> & {
  destination?: AdminSwitchDestination;
};

const DESTINATION_ICON: Record<AdminSwitchDestination, LucideIcon> = {
  admin: ChevronRight,
  worker: ChevronLeft,
};

export function AdminSwitch({
  destination = "admin",
  className,
  ...rest
}: AdminSwitchProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={SWITCH_HIT_SLOP}
      className={cn(
        "min-h-11 flex-row items-center gap-1 rounded-sm active:bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      <Icon
        icon={DESTINATION_ICON[destination]}
        size={SWITCH_ICON_SIZE}
        className="text-fg-neutral"
      />
      <Text className="font-medium text-xs text-fg-neutral">관리자</Text>
    </Pressable>
  );
}
