import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 화면 아래에서 올라오는 면이다. 화면 폭에 붙고 위쪽 두 모서리만 둥글며, 위쪽 한 변에만 선을
 * 둔다 — 나머지 세 변은 화면 밖이라 선을 두를 자리가 없다.
 *
 * 뒤가 어두워지는 스크림이 시트를 띄우는 몫을 하므로 그림자가 없어도 앞뒤가 갈린다.
 *
 * `distance`는 올라오는 거리고 `src/shared/lib/reduce-motion.ts`가 정한다 — 「동작 줄이기」가
 * 켜져 있으면 0이 와서 이동 없이 밝기만 바뀐다.
 *
 * 끌어 올리고 내리는 손짓과 스냅은 이 면이 아니라 `DraggableSheet`가 준다.
 */

export type BottomSheetProps = ViewProps & {
  distance?: number;
  testID?: string;
};

export function BottomSheet({
  distance = 0,
  className,
  children,
  testID,
  style,
  ...rest
}: BottomSheetProps) {
  return (
    <View
      testID={testID}
      style={[style, { transform: [{ translateY: distance }] }]}
      className={cn(
        "w-full rounded-t-lg border-t border-stroke-neutral bg-bg-neutral p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

/** 시트 뒤를 덮는 면이다. 투명도가 토큰 안에 들어 있어 따로 얹지 않는다. */
export function Scrim({ className, ...rest }: ViewProps) {
  return (
    <View className={cn("absolute inset-0 bg-bg-scrim", className)} {...rest} />
  );
}
