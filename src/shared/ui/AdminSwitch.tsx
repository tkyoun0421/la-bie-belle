import {
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 근무자 층과 관리자 층 사이를 오가는 문이다. 근무자 화면에서는 관리자 홈을 열고, 관리자 홈에서는
 * 근무자 쪽으로 돌아간다 — 그 화면에 뒤로는 없으니 돌아오는 길이 이 스위치 하나다. 값의 정본은
 * `docs/2-design/design-system/components.md`의 「관리자 스위치」 소절이다.
 *
 * 아이콘 하나로 두지 않고 「관리자」를 붙인다. 층을 넘는 문이 하나뿐인데 아이콘만 서면 처음 보는
 * 사람이 종 아이콘과 갈라 읽지 못한다. 글자가 붙으면 돌아오는 쪽 스위치도 「지금 관리자에 있다」로
 * 읽힌다.
 *
 * 브랜드 색을 안 쓴다. 층을 바꾸는 문이지 이 화면의 주요 액션이 아니다. 면도 평소에는 없고 누를
 * 때만 잠깐 깔린다.
 *
 * 닿는 면은 세로 44px이고 가로는 글자 폭에 `hitSlop`이 붙는다 — 그리는 크기는 그대로 둔다.
 */

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
