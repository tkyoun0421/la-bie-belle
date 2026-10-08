import {
  CircleAlert,
  CircleCheck,
  Info,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react-native";
import { View, type ViewProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type NoticeKind = "info" | "success" | "warning" | "error";

type NoticeStyle = {
  icon: LucideIcon;
  surface: string;
  iconColor: string;
};

const NOTICES: Record<NoticeKind, NoticeStyle> = {
  info: { icon: Info, surface: "bg-bg-sky-weak", iconColor: "text-fg-sky" },
  success: {
    icon: CircleCheck,
    surface: "bg-bg-positive-weak",
    iconColor: "text-fg-positive",
  },
  warning: {
    icon: TriangleAlert,
    surface: "bg-bg-warning-weak",
    iconColor: "text-warning-500",
  },
  error: {
    icon: CircleAlert,
    surface: "bg-bg-critical-weak",
    iconColor: "text-fg-critical",
  },
};

export type NoticeBlockProps = ViewProps & {
  kind?: NoticeKind;
  testID?: string;
};

export function NoticeBlock({
  kind = "info",
  className,
  children,
  testID,
  ...rest
}: NoticeBlockProps) {
  const notice = NOTICES[kind];

  return (
    <View
      testID={testID}
      className={cn("flex-row gap-2 rounded-lg p-5", notice.surface, className)}
      {...rest}
    >
      <Icon icon={notice.icon} className={notice.iconColor} />
      <Text className="flex-1 text-base text-fg-neutral">{children}</Text>
    </View>
  );
}
