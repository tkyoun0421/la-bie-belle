import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 근무표 날 상세의 자리 카드다. 높이 하나에 모양이 둘 — 사람이 든 자리는 면이 있고 빈 자리는
 * 점선이다(`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「날 상세 색」).
 *
 * **자리 추가 줄도 이 조각이다.** 빈 자리와 같은 점선이고 글자만 다르다 — 목록 끝에서 같은
 * 폭 같은 높이로 서야 「여기도 자리」로 읽힌다.
 *
 * 안에 서는 글자와 배지는 부르는 쪽이 넣는다. 카드가 아는 것은 높이와 면과 테두리까지다.
 */

export type SlotCardVariant = "filled" | "empty";

export type SlotCardProps = Omit<PressableProps, "children"> & {
  variant?: SlotCardVariant;
  right?: ReactNode;
  children: ReactNode;
};

const VARIANTS: Record<SlotCardVariant, string> = {
  filled: "bg-bg-neutral-weak",
  empty: "border border-dashed border-stroke-neutral-muted",
};

export function SlotCard({
  variant = "empty",
  right,
  className,
  children,
  testID,
  ...rest
}: SlotCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      className={cn(
        "h-12 flex-row items-center gap-2 rounded-lg px-4",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
      {right === undefined ? null : (
        <View className="ml-auto flex-row items-center gap-2">{right}</View>
      )}
    </Pressable>
  );
}
