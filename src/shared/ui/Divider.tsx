import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 가로로 긋는 가는 선 하나다. 위아래 여백은 안 든다 — 무엇과 무엇을 가르는지에 따라 달라서
 * 부르는 쪽이 `my-*`로 준다.
 *
 * 목록 줄 사이의 선은 [ListRow](ListRow.tsx)가 제 안에 들고 있다. 이 조각은 그 밖에서 성격이
 * 다른 두 덩이를 가르는 자리다 — 한 장면 화면에서 본문과 계정·로그아웃 덩이 사이가 그
 * 자리다([login.md]의 「승인 대기 짜임」).
 */
export function Divider({ className, ...rest }: ViewProps) {
  return (
    <View
      accessibilityRole="none"
      className={cn("h-px bg-stroke-neutral", className)}
      {...rest}
    />
  );
}
