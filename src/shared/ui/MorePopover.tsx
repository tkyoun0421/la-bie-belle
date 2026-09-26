import { Pressable, View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 앱바나 시트 오른쪽 위 더보기(⋯)를 누르면 그 아래로 열리는 짧은 목록이다. 가입 대기의 차단과
 * 직원 관리의 퇴사 처리가 여기다.
 *
 * **주 동작을 여기 숨기지 않는다.** 팝오버는 자주 안 쓰지만 있어야 하는 것의 자리다.
 *
 * 덮개가 없고 등장 모션도 없다 — 누른 손가락 바로 아래 뜨는 것이라 움직임이 없어도 어디서
 * 왔는지 안다. 덮개가 없으니 떠 있는 면인데 그림자도 없고 테두리 1px만 앞뒤를 가른다.
 *
 * 밖을 누르면 닫히는 것은 이 면이 아니라 이 면을 띄운 화면이 맡는다. 덮개가 없어서 밖을 잡을
 * 면이 팝오버 안에 없다 — 여기서 투명한 막을 깔면 그것이 곧 덮개다.
 *
 * 더보기 아이콘 바로 아래 서고 오른쪽 끝을 아이콘에 맞춘다. 아이콘을 담은 자리가
 * `relative`여야 이 면이 그 아래에 붙는다.
 *
 * 폭은 내용을 따르되 148px보다 좁아지지 않는다 — 스페이싱 눈금에 없는 값이라 숫자로 준다.
 */

const MIN_WIDTH = 148;

export type MorePopoverProps = ViewProps & {
  open: boolean;
  testID?: string;
};

export function MorePopover({
  open,
  className,
  children,
  testID,
  style,
  ...rest
}: MorePopoverProps) {
  if (!open) {
    return null;
  }

  return (
    <View
      testID={testID}
      style={[{ minWidth: MIN_WIDTH }, style]}
      className={cn(
        "absolute top-full right-0 rounded-lg border border-stroke-neutral bg-bg-neutral p-1.5",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

/**
 * 팝오버 한 줄이다. `irreversible`은 되돌릴 길이 없는 항목에만 준다 — 차단은 빨갛고 퇴사
 * 처리는 아니다. 퇴사한 사람은 같은 화면 아래 퇴사 구획에 남아 되돌릴 수 있다.
 */
export type MorePopoverItemProps = {
  label: string;
  onPress: () => void;
  irreversible?: boolean;
  className?: string;
  testID?: string;
};

export function MorePopoverItem({
  label,
  onPress,
  irreversible = false,
  className,
  testID,
}: MorePopoverItemProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        "rounded-md px-3 py-2.5 active:bg-bg-neutral-weak-pressed",
        className,
      )}
    >
      <Text
        className={cn(
          "text-sm",
          irreversible ? "text-fg-critical" : "text-fg-neutral",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
