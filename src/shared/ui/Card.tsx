import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 화면의 기본 단위다. 회색 바닥 위에 흰 카드가 서너 장 서고 글자 대부분이 카드 안에 있다.
 *
 * **테두리가 없다.** 라이트에서는 그림자가, 다크에서는 바닥과의 명도 차가 카드를 띄운다 —
 * 다크에서 `shadow.card`는 `none`이고 그것으로 끝이다. 선을 두르면 같은 카드가 상자로 읽힌다.
 *
 * **카드 안에 카드를 넣지 않는다.** 한 겹 더 눌린 면이 필요하면 `bg.neutral-weak`를 깐다.
 */

export type CardProps = ViewProps;

export function Card({ className, children, testID, ...rest }: CardProps) {
  return (
    <View
      testID={testID}
      className={cn("rounded-xl bg-bg-neutral p-5 shadow-card", className)}
      {...rest}
    >
      {children}
    </View>
  );
}

/**
 * 카드 머리다. 제목 왼쪽에 그림 자리가 있고 거기 서는 것은 `Tossface`다 — 카드마다 다는 것이
 * 아니라 카드가 무엇인지 그림으로 먼저 말할 값이 있을 때고, 어느 카드가 갖는지는 화면 문서가
 * 정한다.
 */

export type CardHeaderProps = ViewProps & {
  title: string;
  leading?: ReactNode;
};

export function CardHeader({
  title,
  leading,
  className,
  children,
  testID,
  ...rest
}: CardHeaderProps) {
  return (
    <View
      testID={testID}
      className={cn("flex-row items-center gap-2", className)}
      {...rest}
    >
      {leading}
      <Text className="font-semibold text-lg text-fg-neutral">{title}</Text>
      {children}
    </View>
  );
}
