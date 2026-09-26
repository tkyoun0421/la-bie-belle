import { Pressable, View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 같은 자료를 다른 단위로 보는 스위치다. 급여 조회의 달·주와 통계의 기간이 여기다. `Tabs`와
 * 다른 점은 화면이 안 바뀐다는 것이다 — 아래 내용이 다른 눈금으로 다시 서는 것뿐이다.
 *
 * 칸 폭이 모두 같다. 선택 면 하나가 새 칸까지 미끄러지는 것이라 폭이 다르면 면이 이동하며
 * 늘고 줄어 흔들린다.
 *
 * 브랜드 색을 안 쓴다. 세그먼트는 카드 안이나 제목 아래에 서서 화면의 주인공이 아니다. 칸은
 * 둘이나 셋이고 넷부터는 글자가 좁아져 `Tabs`로 간다.
 *
 * 칸 높이는 트랙에서 위아래 여백을 뺀 만큼이고 글자에 패딩을 붙여 잡지 않는다. 선택 칸의
 * 라운딩은 트랙에서 안쪽 여백만큼 내린 값이라 스페이싱 눈금에 없다 — 숫자로 준다.
 */

const SELECTED_RADIUS = 10;

export type SegmentOption = {
  value: string;
  label: string;
};

export type SegmentProps = Omit<ViewProps, "children"> & {
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
};

export function Segment({
  options,
  value,
  onChange,
  className,
  testID,
  ...rest
}: SegmentProps) {
  return (
    <View
      testID={testID}
      className={cn(
        "h-11 flex-row rounded-lg bg-bg-neutral-weak p-1",
        className,
      )}
      {...rest}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{ borderRadius: SELECTED_RADIUS }}
            className={cn(
              "h-9 flex-1 items-center justify-center",
              selected && "bg-bg-neutral",
            )}
          >
            <Text
              className={cn(
                "font-medium text-sm",
                selected ? "text-fg-neutral" : "text-fg-neutral-subtle",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
