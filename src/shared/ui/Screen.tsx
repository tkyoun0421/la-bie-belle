import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 화면 한 장이 서는 바닥이다. `flex-1`과 `bg.neutral` 둘뿐이고 여백은 안 든다 — 화면마다
 * 좌우 여백이 다르고 앱바·탭 바·BottomCTA가 제 면을 갖고 서기 때문이다.
 *
 * 조각으로 올린 것은 바탕색이 화면이 고를 값이 아니기 때문이다. 규칙 19가 화면 파일에서
 * `bg-` 유틸리티를 막고, 막힌 자리는 조각이 받는다 —
 * [components.md](../../../docs/2-design/design-system/components.md)의 「개발자가 색을
 * 고르지 않아도 되게」다.
 *
 * 카드가 안 서는 한 장면 화면이 이 바닥 위에 글과 그림만 세운다
 * (`foundation/spacing-shape.md`의 「카드가 안 서는 화면」).
 */
export function Screen({ className, ...rest }: ViewProps) {
  return <View className={cn("flex-1 bg-bg-neutral", className)} {...rest} />;
}
