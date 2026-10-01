import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/utils/cn";

/**
 * 사람이 쓴 글이 그대로 앉는 면이다. 승인할 일의 취소 사유와 출근 사유가 여기 선다 —
 * 관리자가 읽고 판단하는 대상이 그 글 하나라 화면의 다른 문장과 면으로 가른다.
 *
 * 카드 안에 카드를 넣지 않는 대신 한 겹 눌린 면을 깐다
 * ([components.md](../../../docs/2-design/design-system/components.md)). 그림자를 안 받고
 * 자기 라운딩을 쓴다.
 *
 * 글자는 이 면이 안 정한다. 담는 쪽이 `Text`로 넣는다 — 인용한 글의 크기가 자리마다 다르다.
 */

export type QuoteBlockProps = ViewProps;

export function QuoteBlock({
  className,
  children,
  testID,
  ...rest
}: QuoteBlockProps) {
  return (
    <View
      testID={testID}
      className={cn("rounded-md bg-bg-neutral-weak p-4", className)}
      {...rest}
    >
      {children}
    </View>
  );
}
