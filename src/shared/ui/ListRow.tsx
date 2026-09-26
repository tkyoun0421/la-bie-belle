import { Check, ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 목록의 한 줄이다. 왼쪽에 아이콘이나 프로필, 가운데에 제목과 보조 정보, 오른쪽에 값이나
 * 화살표가 온다 — 넷 다 선택이고 제목만 필수다.
 *
 * **오른쪽 값의 색은 그 값이 답인지 미리보기인지로 갈린다.** 그 줄이 말하려는 것 자체인 값은
 * `fg.neutral`이고, 진짜 내용은 눌러야 나오는 줄의 값은 `fg.neutral-muted`다. 가르는 질문은
 * 「이 값을 보려고 이 화면에 왔는가」다. 화살표를 단 줄은 눌러야 나오는 줄이라 `valueTone`의
 * 기본값이 `chevron`을 따라가고, 둘이 어긋나는 자리만 `valueTone`을 직접 준다.
 *
 * 누를 수 있는 줄은 `onPress`를 받은 줄이다. 안 받은 줄에는 누름 배경도 안 걸린다 — 화살표는
 * 다음 화면이 있다는 뜻으로만 쓴다.
 *
 * `divider`는 윗줄과 자기 사이에 긋는 선이라 목록의 첫 줄은 안 받는다. 선이 왼쪽 콘텐츠 시작
 * 지점부터 시작하도록 이 줄은 좌우 여백을 안 갖는다 — 가로 여백은 줄을 담는 카드나 화면이
 * 가진다.
 *
 * 읽지 않은 알림은 왼쪽 점으로 말한다. 줄 전체의 배경색을 바꾸지 않는다 — 배경으로 상태를
 * 나누면 스크롤할 때 색 띠가 생긴다.
 */

const ROW_ICON_SIZE = 20;

export type ListRowValueTone = "answer" | "preview";

export type ListRowProps = Omit<PressableProps, "children"> & {
  title: string;
  detail?: string;
  value?: string;
  valueTone?: ListRowValueTone;
  left?: ReactNode;
  chevron?: boolean;
  selected?: boolean;
  unread?: boolean;
  divider?: boolean;
  className?: string;
  testID?: string;
};

export function ListRow({
  title,
  detail,
  value,
  valueTone,
  left,
  chevron = false,
  selected = false,
  unread = false,
  divider = false,
  className,
  testID,
  onPress,
  ...rest
}: ListRowProps) {
  const pressable = onPress !== undefined;
  const tone = valueTone ?? (chevron ? "preview" : "answer");

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!pressable}
      className={cn(
        "w-full flex-row items-center gap-3 py-4",
        divider && "border-t border-stroke-neutral",
        pressable && "active:bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      {unread ? (
        <View
          testID={testID ? `${testID}-unread` : undefined}
          className="h-2 w-2 rounded-full bg-bg-brand-solid"
        />
      ) : null}
      {left}
      <View className="flex-1 gap-1">
        <Text className="font-medium text-base text-fg-neutral">{title}</Text>
        {detail ? (
          <Text className="text-sm text-fg-neutral-subtle">{detail}</Text>
        ) : null}
      </View>
      {value ? (
        <Text
          className={cn(
            "text-base",
            tone === "answer" ? "text-fg-neutral" : "text-fg-neutral-muted",
          )}
        >
          {value}
        </Text>
      ) : null}
      {selected ? (
        <Icon icon={Check} size={ROW_ICON_SIZE} className="text-fg-brand" />
      ) : null}
      {chevron ? (
        <Icon
          icon={ChevronRight}
          size={ROW_ICON_SIZE}
          className="text-fg-neutral-subtle"
        />
      ) : null}
    </Pressable>
  );
}
