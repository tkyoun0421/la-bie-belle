import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Illustration, type IllustrationScene } from "@/shared/ui/Illustration";
import { Text } from "@/shared/ui/Text";

/**
 * 목록이 설 자리에 아직 올 것이 없을 때 그 자리에 그대로 서는 조각이다. 근무한 날이 없는 급여,
 * 승인할 것이 없는 대기 목록, 직원이 아직 없는 매장이 여기다. 첫 줄이 생기는 순간 이 자리가
 * 그대로 목록이 된다.
 *
 * **화면이 통째로 비는 자리는 이 조각이 아니다.** 가르는 것은 「이 자리에 줄이 하나 생기면
 * 그대로 목록이 되는가」다. 화면 전체가 비고 채우는 동작 하나가 주요 버튼으로 서는 자리는
 * 큰 그림과 큰 제목과 버튼을 세로 가운데에 세우는 다른 짜임이다.
 *
 * **그림이 있고 버튼은 없다.** 그림은 비어 있음이 오류가 아니라는 것을 말한다 — 글자만 선 빈
 * 자리는 못 받아온 화면과 갈리지 않는다. 어디로 가면 채워지는지는 아래 줄 문장이 말한다.
 *
 * 그림은 빈 상태마다 다르다. 장면 목록은 `docs/2-design/design-system/illustration.md`가
 * 든다 — 같은 그림을 돌려 쓰면 그림이 「비었다」는 뜻 하나로 굳는다.
 *
 * 한 문장으로 끝나면 제목 없이 그림과 아래 줄만 선다. 무엇이 비었는지가 화면 제목만으로 이미
 * 분명할 때다.
 */

export type EmptyStateProps = Omit<ViewProps, "children"> & {
  scene: IllustrationScene;
  title?: string;
  description: string;
  testID?: string;
};

export function EmptyState({
  scene,
  title,
  description,
  className,
  testID,
  ...rest
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      className={cn("items-center gap-4 py-6", className)}
      {...rest}
    >
      <Illustration scene={scene} size="small" />
      <View className="items-center">
        {title ? (
          <Text className="text-center font-medium text-base text-fg-neutral">
            {title}
          </Text>
        ) : null}
        <Text
          className={cn(
            "text-center text-sm text-fg-neutral-subtle",
            title && "mt-0.5",
          )}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
