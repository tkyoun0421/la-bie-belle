import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 켬과 끔 둘뿐인 설정에 서는 스위치다. 라벨은 줄 왼쪽 글자가 맡고 스위치 안에는 글자를 넣지
 * 않는다. 누르면 그 자리에서 바로 바뀌고 저장 버튼이 따로 없다.
 *
 * **켬이 브랜드 색이 아니다.** 설정 목록 줄마다 서는 것이라 브랜드로 칠하면 목록이 브랜드
 * 점으로 찬다. 켬은 진한 면, 끔은 눌린 면으로 가른다.
 *
 * 트랙은 26px 그대로 두고 `hitSlop`이 위아래를 받아 닿는 면을 44px로 만든다 — 모양을 안
 * 키우고 닿는 면만 넓히는 자리다.
 *
 * 테두리를 켬에서도 두르되 색만 투명으로 둔다. 끔에서만 선을 그리면 그 1px이 안쪽 상자를
 * 좁혀 손잡이 자리와 이동 거리가 두 상태에서 달라진다 — 색으로만 가르면 42×24 상자가 양쪽
 * 같아서 손잡이가 늘 가장자리에서 3px에 서고 이동 거리도 18px로 같다.
 *
 * 끔 상태에서 흰 손잡이를 눌린 회색 트랙에서 떼는 방법은 아직 안 정했다
 * (`docs/2-design/design-system/tokens.md` 「아직 안 정한 것」).
 */

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const THUMB_OFF_X = 2;
const THUMB_TRAVEL = 18;
const HIT_SLOP_Y = 9;

export type SwitchProps = Omit<PressableProps, "onPress" | "style"> & {
  value: boolean;
  onValueChange: (value: boolean) => void;
  className?: string;
  testID?: string;
};

export function Switch({
  value,
  onValueChange,
  className,
  testID,
  ...rest
}: SwitchProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={{ top: HIT_SLOP_Y, bottom: HIT_SLOP_Y }}
      onPress={() => onValueChange(!value)}
      style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
      className={cn(
        "justify-center rounded-full border",
        value
          ? "border-transparent bg-bg-neutral-solid"
          : "border-stroke-neutral-muted bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      <View
        testID={testID ? `${testID}-thumb` : undefined}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          marginLeft: value ? THUMB_OFF_X + THUMB_TRAVEL : THUMB_OFF_X,
        }}
        className="rounded-full bg-fg-neutral-contrast"
      />
    </Pressable>
  );
}
