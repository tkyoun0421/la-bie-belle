import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 화면 바닥에 붙어 마지막 한 번을 받는 자리다. 근무표의 「확정하기」와 근무 신청의 「보내기」가
 * 여기고, 화면 어딘가에 답할 것이 그려져 있는 버튼은 여기 오지 않는다 — 근거는
 * `docs/2-design/design-system/components.md`의 「BottomCTA」절이다.
 *
 * 아래쪽 여백에 `useSafeAreaInsets`의 `bottom`을 더한다. 아이폰 홈 인디케이터가 버튼을
 * 깔고 앉는 것을 막으려는 것이고, 그 값이 0인 기기에서는 안쪽 여백만 남는다.
 *
 * 위쪽 선은 `scrollable`이 켜졌을 때만 그린다. 목록 끝까지 내려와 잘릴 것이 없는데 선이 남으면
 * 근거 없는 구획이 하나 생긴다.
 *
 * 버튼은 하나만 넣는다. 엄지가 닿는 자리는 화면 맨 아래 하나뿐이라 둘을 나란히 두면 잘못
 * 눌린다. 둘이 필요해 보이면 하나를 본문 안으로 올린다.
 */

const CONTAINER_PADDING = 20;

export type BottomCTAProps = ViewProps & {
  scrollable?: boolean;
  note?: ReactNode;
};

export function BottomCTA({
  scrollable = false,
  note,
  className,
  children,
  style,
  ...rest
}: BottomCTAProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[style, { paddingBottom: CONTAINER_PADDING + insets.bottom }]}
      className={cn(
        "gap-2 bg-bg-neutral px-5 pt-5",
        scrollable && "border-t border-stroke-neutral",
        className,
      )}
      {...rest}
    >
      {typeof note === "string" ? (
        <Text className="text-center text-sm text-fg-neutral-subtle">
          {note}
        </Text>
      ) : (
        note
      )}
      {children}
    </View>
  );
}
