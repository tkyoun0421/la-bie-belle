import { ChevronDown, ChevronUp } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const CHEVRON_SIZE = 16;

export type AccordionRowProps = {
  title: string;
  status?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  divider?: boolean;
  children?: ReactNode;
  testID?: string;
};

export function AccordionRow({
  title,
  status,
  expanded,
  onToggle,
  divider = false,
  children,
  testID,
}: AccordionRowProps) {
  return (
    <View className={cn(divider && "border-t border-stroke-neutral")}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        className="flex-row items-center gap-2 py-4"
      >
        <Text size="sm" weight="medium" className="flex-1">
          {title}
        </Text>
        {status}
        <Icon
          icon={expanded ? ChevronUp : ChevronDown}
          size={CHEVRON_SIZE}
          className="text-fg-neutral-subtle"
        />
      </Pressable>
      {expanded ? <View className="pb-4">{children}</View> : null}
    </View>
  );
}
