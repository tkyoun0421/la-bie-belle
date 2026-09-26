import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 화면이 데이터를 기다리는 동안 그 자리에 서는 회색 덩이다. 카드 모양 그대로라 내용이 오면
 * 덩이가 카드로, 막대가 글자로 그 자리에서 바뀐다 — 레이아웃이 안 움직인다.
 *
 * shimmer는 덩이 위로 옅은 빛 한 줄이 지나가는 것이고, 「동작 줄이기」가 켜져 있으면 서지
 * 않고 덩이만 남는다(`docs/2-design/design-system/foundation/motion.md` 「접근성」).
 * 판정은 `src/shared/lib/reduce-motion.ts`가 읽어 넘긴다 — 조각은 받은 값을 그리기만 한다.
 */

export type SkeletonProps = ViewProps & {
  reduceMotion?: boolean;
  testID?: string;
};

export function Skeleton({
  reduceMotion = false,
  className,
  testID,
  ...rest
}: SkeletonProps) {
  return (
    <View
      testID={testID}
      className={cn("overflow-hidden rounded-xl bg-bg-neutral-weak", className)}
      {...rest}
    >
      {reduceMotion ? null : (
        <View
          testID={testID ? `${testID}-shimmer` : undefined}
          className="h-full w-1/3 bg-bg-neutral opacity-40"
        />
      )}
    </View>
  );
}

/** 글이 설 자리의 막대다. 폭은 제목 60퍼센트·본문 90퍼센트다. */
export function SkeletonLine({
  reduceMotion = false,
  className,
  testID,
  ...rest
}: SkeletonProps) {
  return (
    <Skeleton
      reduceMotion={reduceMotion}
      testID={testID}
      className={cn("h-5 rounded-sm bg-bg-neutral-weak-pressed", className)}
      {...rest}
    />
  );
}
