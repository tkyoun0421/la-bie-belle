import { CircleCheck } from "lucide-react-native";
import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const CHECK_ICON_SIZE = 18;

export type PushNoticeTone = "idle" | "enabled" | "denied";

const SURFACES: Record<PushNoticeTone, string> = {
  idle: "bg-bg-neutral-weak",
  enabled: "bg-bg-positive-weak",
  denied: "bg-bg-sky-weak",
};

export type PushNoticeProps = ViewProps & {
  tone: PushNoticeTone;
  title: string;
  subline: string;
  action?: ReactNode;
  testID?: string;
};

export function PushNotice({
  tone,
  title,
  subline,
  action,
  className,
  testID,
  ...rest
}: PushNoticeProps) {
  return (
    <View
      testID={testID}
      className={cn("w-full rounded-lg p-4", SURFACES[tone], className)}
      {...rest}
    >
      <View className="flex-row items-center gap-2">
        {tone === "enabled" ? (
          <Icon icon={CircleCheck} size={CHECK_ICON_SIZE} tone="positive" />
        ) : null}
        <Text size="sm" weight="semibold" className="flex-1">
          {title}
        </Text>
      </View>
      <Text size="xs" tone="muted" className="mt-2">
        {subline}
      </Text>
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
