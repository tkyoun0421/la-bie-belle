import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
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
 *
 * **칸은 글자거나 아이콘이고 둘을 섞지 않는다.** 아이콘 칸은 `accessibilityLabel`을 꼭 받는다 —
 * 글자가 없으면 그 칸이 무엇인지 말할 데가 거기뿐이다. 근무표의 달력 순·포지션 순이 첫
 * 자리다([schedule-worker.md](../../../docs/2-design/modules/schedule/screens/schedule-worker.md#보기-전환-세그먼트)).
 *
 * **면 하나가 미끄러진다.** 칸마다 배경을 켜고 끄면 고른 자리가 사라졌다 다시 생기는 것으로
 * 읽히는데, 세그먼트가 말하는 것은 「하나를 골랐다」는 사실이라 그 하나가 자리를 옮겨야 한다.
 * 첫 렌더는 안 움직인다 — 등장 모션이 아니다.
 */

const SELECTED_RADIUS = 10;

/** 트랙의 `p-1`이다. 면의 폭과 이동 거리를 재려면 숫자로 알아야 한다. */
const TRACK_PADDING = 4;

/** `--duration-fast`(tokens.md). */
const SLIDE_DURATION_MS = 125;

/** 글자 칸의 `text-sm`과 나란한 크기다 — 아이콘은 옆 글자를 따라간다. */
const SEGMENT_ICON_SIZE = 18;

export type SegmentOption =
  | { value: string; label: string }
  | { value: string; icon: LucideIcon; accessibilityLabel: string };

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
  const [trackWidth, setTrackWidth] = useState(0);
  const faceWidth =
    trackWidth === 0 ? 0 : (trackWidth - TRACK_PADDING * 2) / options.length;
  const selectedAt = options.findIndex((option) => option.value === value);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(Math.max(selectedAt, 0) * faceWidth, {
          duration: SLIDE_DURATION_MS,
        }),
      },
    ],
  }));

  return (
    <View
      testID={testID}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      className={cn(
        "h-11 flex-row rounded-lg bg-bg-neutral-weak p-1",
        className,
      )}
      {...rest}
    >
      {faceWidth === 0 || selectedAt < 0 ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            faceStyle,
            {
              position: "absolute",
              left: TRACK_PADDING,
              top: TRACK_PADDING,
              width: faceWidth,
              borderRadius: SELECTED_RADIUS,
            },
          ]}
          className="h-9 bg-bg-neutral"
        />
      )}

      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={
              "icon" in option ? option.accessibilityLabel : undefined
            }
            onPress={() => onChange(option.value)}
            className="h-9 flex-1 items-center justify-center"
          >
            {"icon" in option ? (
              <Icon
                icon={option.icon}
                size={SEGMENT_ICON_SIZE}
                className={
                  selected ? "text-fg-neutral" : "text-fg-neutral-subtle"
                }
              />
            ) : (
              <Text
                className={cn(
                  "font-medium text-sm",
                  selected ? "text-fg-neutral" : "text-fg-neutral-subtle",
                )}
              >
                {option.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
