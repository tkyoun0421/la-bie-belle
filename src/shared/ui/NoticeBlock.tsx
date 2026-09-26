import {
  CircleAlert,
  CircleCheck,
  Info,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react-native";
import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 화면 안에 끼는 안내 상자다. 종류는 안내·성공·경고·오류 넷이다.
 *
 * **넷 다 글자가 `fg.neutral`이다.** 옅은 배경 위에서는 뜻을 아이콘이 나르고 글자는 읽히는
 * 데만 집중한다 — 글자까지 색을 입히면 문장이 길어질수록 읽기 힘들어진다.
 *
 * 경고 아이콘만 역할 토큰 없이 계열색을 직접 부른다. `fg.warning`을 안 만들어서고 근거는
 * `docs/2-design/design-system/tokens.md`에 있다.
 *
 * 안쪽 여백은 `docs/2-design/design-system/foundation/spacing-shape.md` 「면의 안쪽 여백은
 * 20px이다」를 따른다 — 조각 표가 이 값을 따로 들고 있지 않다.
 */

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
