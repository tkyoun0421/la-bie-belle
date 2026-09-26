import { Check, Info } from "lucide-react-native";
import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 화면 위에 잠깐 뜨는 통보다. 반전 면이라 라이트에서 어둡고 다크에서 밝다.
 *
 * **한 줄이다.** 줄을 안 바꾼다 — 두 줄이 되면 떠 있는 표식이 아니라 덩어리로 읽힌다.
 * 종류는 성공과 안내 둘뿐이다. 경고와 오류는 사람이 조치할 것이 있는 자리라 사라지는 것에
 * 싣지 않는다.
 *
 * `distance`는 뜰 때 밀려 올라오는 거리고 `src/shared/lib/reduce-motion.ts`가 정한다 —
 * 「동작 줄이기」가 켜져 있으면 0이 와서 자리에서 밝기만 바뀐다.
 */

const TOAST_ICON_SIZE = 16;

/** 16px 원 안에서 lucide 기본 굵기로는 안쪽 표시가 안 읽힌다. */
const TOAST_ICON_STROKE_WIDTH = 3.2;

export type ToastKind = "success" | "info";

export type ToastProps = ViewProps & {
  kind?: ToastKind;
  distance?: number;
  testID?: string;
};

/**
 * 면으로 그린다 — 원이 계열색으로 차고 안쪽 표시가 면 색으로 뚫린 모양이다. lucide는 받은
 * 색을 선에만 쓰므로 면은 `fill-*`을 따로 적는다.
 */
const ICONS = {
  success: {
    icon: Check,
    className: "fill-fg-positive-contrast text-fg-positive-contrast",
  },
  info: { icon: Info, className: "fill-fg-sky-contrast text-fg-sky-contrast" },
} as const;

export function Toast({
  kind = "success",
  distance = 0,
  className,
  children,
  testID,
  style,
  ...rest
}: ToastProps) {
  const mark = ICONS[kind];

  return (
    <View
      testID={testID}
      style={[style, { transform: [{ translateY: distance }] }]}
      className={cn(
        "flex-row items-center gap-2 self-center rounded-lg bg-bg-neutral-solid-soft px-4 py-3",
        className,
      )}
      {...rest}
    >
      <Icon
        icon={mark.icon}
        size={TOAST_ICON_SIZE}
        strokeWidth={TOAST_ICON_STROKE_WIDTH}
        className={mark.className}
      />
      <Text numberOfLines={1} className="text-sm text-fg-neutral-contrast">
        {children}
      </Text>
    </View>
  );
}
