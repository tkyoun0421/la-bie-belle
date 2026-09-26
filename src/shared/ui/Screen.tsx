import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 화면 한 장이 서는 바닥이다. `flex-1`과 바닥색뿐이고 여백은 안 든다 — 화면마다 좌우 여백이
 * 다르고 앱바·탭 바·BottomCTA가 제 면을 갖고 서기 때문이다.
 *
 * 조각으로 올린 것은 바탕색이 화면이 고를 값이 아니기 때문이다. 규칙 19가 화면 파일에서
 * `bg-` 유틸리티를 막고, 막힌 자리는 조각이 받는다 —
 * [components.md](../../../docs/2-design/design-system/components.md)의 「화면 바닥과 가는
 * 선」이 정본이다.
 *
 * **바닥이 둘이다.** 카드가 서는 화면은 회색 바닥(`sunken`) 위에 흰 카드가 뜨고, 카드가 안
 * 서는 한 장면 화면은 흰 바닥(`plain`) 위에 글과 그림만 선다
 * (`foundation/spacing-shape.md`의 「카드가 기본이다」). 카드 쪽이 기본인 것은 그것이 화면의
 * 기본 단위라서다 — 한 장면 화면이 세는 쪽이다.
 */

export type ScreenFloor = "sunken" | "plain";

const FLOORS: Record<ScreenFloor, string> = {
  sunken: "bg-bg-neutral-sunken",
  plain: "bg-bg-neutral",
};

export type ScreenProps = ViewProps & {
  floor?: ScreenFloor;
};

export function Screen({ floor = "sunken", className, ...rest }: ScreenProps) {
  return <View className={cn("flex-1", FLOORS[floor], className)} {...rest} />;
}
