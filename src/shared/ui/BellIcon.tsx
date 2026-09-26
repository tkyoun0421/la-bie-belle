import { Bell } from "lucide-react-native";
import { Pressable, type PressableProps, View } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";

/**
 * 앱바 오른쪽에 서서 알림 목록을 여는 종이다. 서는 화면은 근무자 탭 넷과 관리자 홈이고, 그 밖의
 * 화면에는 없다 — 밀려 올라간 화면에서 또 밀려 올라가면 돌아오는 길이 길어진다. 값의 정본은
 * `docs/2-design/design-system/components.md`의 「종 아이콘」 소절이다.
 *
 * 수를 안 적고 점만 찍는다. 몇 건인지는 대시보드의 「안 본 알림 n」이 말하고, 같은 수가 두 자리에
 * 서면 하나가 늦게 갱신될 때 어긋난다. 이 자리가 말하는 것은 「새것이 있다」 하나다. 안 읽은 것이
 * 없으면 점만 빠지고 아이콘은 그대로 선다.
 *
 * 점이 종의 오른쪽 어깨에 물리면서도 따로 읽히는 것은 둘레의 테두리가 바닥과 같은 색이라서다.
 * 테두리까지 합쳐 12px 상자이므로 안쪽 원이 8px로 남는다.
 */

const BELL_ICON_SIZE = 28;

const BELL_HIT_SLOP = 8;

export type BellIconProps = Omit<PressableProps, "children"> & {
  unread?: boolean;
};

export function BellIcon({
  unread = false,
  className,
  ...rest
}: BellIconProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={BELL_HIT_SLOP}
      className={cn("relative h-7 w-7 items-center justify-center", className)}
      {...rest}
    >
      <Icon icon={Bell} size={BELL_ICON_SIZE} className="text-fg-neutral" />
      {unread ? (
        <View className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-bg-neutral bg-bg-brand-solid" />
      ) : null}
    </Pressable>
  );
}
