import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 화면 맨 위 한 줄이다. 여기가 어디인지와 나가는 길을 말한다. 값의 정본은
 * `docs/2-design/design-system/components.md`의 「앱바」절이다.
 *
 * 왼쪽에 뒤로, 그 오른쪽에 이어 제목, 오른쪽 끝에 보조 액션이 온다. 제목만 필수다.
 *
 * 결은 둘이다. 뒤로 가기가 있는 화면은 제목형이라 제목이 크고 진하다. 탭 바를 쓰는 허브 화면은
 * 앱바가 「여기가 어디인지」를 말할 일이 적고 그 아래 내용이 주인공이라, 제목이 작고 흐리다.
 *
 * 아래에 선을 안 긋는다. 제목과 본문 사이 여백이 이미 구획을 만들고, 스크롤해도 앱바는 선 없이
 * 그대로 선다. 배경이 `bg.neutral`인 것도 카드와 같은 면이라는 뜻이 아니라 회색 바닥과 갈리는
 * 띠라는 뜻이다 — 카드는 앱바 밑으로 지나간다.
 *
 * 양끝 아이콘은 그리는 크기를 그대로 두고 닿는 면만 `hitSlop`으로 44px까지 넓힌다. 그 상태로
 * 화면 좌우 여백에 두면 아이콘의 빈 둘레가 여백 노릇을 해 글자보다 안쪽으로 밀려 보이므로,
 * 양끝만 바깥으로 조금 당겨 시각 여백을 맞춘다.
 */

const APPBAR_ICON_SIZE = 28;

const APPBAR_HIT_SLOP = 8;

export type AppBarKind = "title" | "hub";

export type AppBarProps = Omit<ViewProps, "children"> & {
  kind?: AppBarKind;
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
};

const TITLE_CLASS: Record<AppBarKind, string> = {
  title: "text-lg font-semibold text-fg-neutral",
  hub: "text-sm text-fg-neutral-subtle",
};

export function AppBar({
  kind = "title",
  title,
  onBack,
  right,
  className,
  ...rest
}: AppBarProps) {
  return (
    <View
      className={cn(
        "min-h-11 flex-row items-center gap-2 bg-bg-neutral px-5 pt-1 pb-3",
        className,
      )}
      {...rest}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={APPBAR_HIT_SLOP}
          className="-ml-1.5"
        >
          <Icon
            icon={ChevronLeft}
            size={APPBAR_ICON_SIZE}
            className="text-fg-neutral"
          />
        </Pressable>
      ) : null}

      <View className="flex-1">
        {typeof title === "string" ? (
          <Text numberOfLines={1} className={TITLE_CLASS[kind]}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      {right ? (
        <View className="-mr-1.5 flex-row items-center gap-2">{right}</View>
      ) : null}
    </View>
  );
}
