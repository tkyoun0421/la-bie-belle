import type { LucideIcon } from "lucide-react-native";
import { Pressable, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 근무자 화면 맨 아래에 항상 서는 넷이다. 값의 정본은
 * `docs/2-design/design-system/components.md`의 「탭 바」절이다.
 *
 * 지금 탭은 채운 아이콘이고 나머지는 선이다. 진하기 하나로 가르면 흐린 글자 배율에서 어느 탭인지
 * 한 번 더 봐야 하는데, 채움과 선은 색이 없어도 갈린다.
 *
 * 지금 탭을 브랜드 색으로 안 칠한다. 탭 바는 모든 화면에 서 있어서 브랜드로 칠하면 이 앱에서
 * 브랜드가 가장 자주 보이는 자리가 내비게이션이 된다. 지금 어디인지는 앱바 제목이 이미 말하고
 * 탭 바는 거들기만 한다.
 *
 * 배지도 숫자도 안 붙인다. 안 본 알림은 대시보드 맨 위가, 근무 요청은 근무표 달력 칸이 말한다.
 *
 * 아래쪽 여백에 `useSafeAreaInsets`의 `bottom`을 더한다. BottomCTA와 같은 이유고, 둘이 한
 * 화면에 서면 BottomCTA가 이 바 위에 얹힌다.
 *
 * 어디로 가는지는 이 조각이 모른다. 누른 탭의 `key`만 올려보내고 라우팅은 화면이 한다.
 */

const TAB_ICON_SIZE = 24;

/**
 * 지금 탭은 채운 아이콘이다. lucide가 받은 색을 선에만 써서 면은 `fill-*`을 따로 적어야
 * 같은 토큰으로 찬다 — 그 두 값을 `Icon`이 같이 옮긴다.
 */
const FILLED_TONE = "fill-fg-neutral text-fg-neutral";

const LINE_TONE = "fill-transparent text-fg-neutral-subtle";

export type TabBarItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export type TabBarProps = Omit<ViewProps, "children"> & {
  items: readonly TabBarItem[];
  current: string;
  onSelect?: (key: string) => void;
};

export function TabBar({
  items,
  current,
  onSelect,
  className,
  style,
  ...rest
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[style, { paddingBottom: insets.bottom }]}
      className={cn(
        "min-h-14 flex-row border-t border-stroke-neutral bg-bg-neutral",
        className,
      )}
      {...rest}
    >
      {items.map((item) => {
        const here = item.key === current;
        const tone = here ? "text-fg-neutral" : "text-fg-neutral-subtle";
        const iconTone = here ? FILLED_TONE : LINE_TONE;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: here }}
            onPress={() => onSelect?.(item.key)}
            className="min-h-14 flex-1 items-center justify-center gap-1"
          >
            <Icon icon={item.icon} size={TAB_ICON_SIZE} className={iconTone} />
            <Text className={cn("text-xs", tone)}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
