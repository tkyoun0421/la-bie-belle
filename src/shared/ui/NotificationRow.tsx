import { ChevronRight } from "lucide-react-native";
import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 알림 목록의 한 줄이다. 정본은
 * `docs/2-design/modules/notification/screens/notifications.md`의 「알림 줄」과 그 문서의
 * 색·글자·여백 표다.
 *
 * **[ListRow](ListRow.tsx)와 결이 같고 값이 다르다.** 왼쪽 점·제목·오른쪽 값·화살표라는
 * 짜임은 같은데, 이 줄은 받은 시각이 한 단계 작고(`text-xs`) 읽은 줄의 제목이 한 단계
 * 연해진다. ListRow의 값은 크기가 하나라 그 둘을 못 낸다 — [명단 줄](RosterRow.tsx)이 같은
 * 이유로 갈라 선 조각이다.
 *
 * **읽음은 글자 색으로만 말한다.** 배경을 안 바꾸는 것은, 목록 전체가 두 색 면으로 갈리면
 * 줄무늬가 되고 훑는 눈이 내용이 아니라 그 무늬를 따라가서다.
 *
 * **누를 수 없는 줄에는 화살표도 누름 배경도 없다.** 목록에서 그런 줄은 관리자 공지 하나고,
 * 갈 곳이 없어서다 — 화살표는 다음 화면이 있다는 뜻으로만 쓴다.
 *
 * **제목이 두 줄까지 간다.** `min-h-14`가 바닥이고 위가 열려 있어 줄 높이가 는다.
 *
 * `testID`를 받은 줄은 점에 `${testID}-unread`, 화살표에 `${testID}-chevron`을 실어 준다.
 * 둘 다 읽어 줄 글자가 없어 그 이름이 없으면 밖에서 확인할 길이 없다.
 */

const ROW_ICON_SIZE = 20;

export type NotificationRowProps = Omit<PressableProps, "children"> & {
  title: string;
  time: string;
  unread?: boolean;
  testID?: string;
};

export function NotificationRow({
  title,
  time,
  unread = false,
  className,
  testID,
  onPress,
  ...rest
}: NotificationRowProps) {
  const pressable = onPress !== undefined;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!pressable}
      className={cn(
        "min-h-14 w-full flex-row items-center py-3",
        pressable && "active:bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      {unread ? (
        <View
          testID={testID ? `${testID}-unread` : undefined}
          className="mr-2 h-2 w-2 rounded-full bg-bg-brand-solid"
        />
      ) : null}

      <Text
        numberOfLines={2}
        tone={unread ? "neutral" : "muted"}
        className="flex-1"
      >
        {title}
      </Text>

      <Text size="xs" tone="subtle" numeric className="ml-3">
        {time}
      </Text>

      {pressable ? (
        <Icon
          icon={ChevronRight}
          size={ROW_ICON_SIZE}
          testID={testID ? `${testID}-chevron` : undefined}
          className="ml-1.5 text-fg-neutral-subtle"
        />
      ) : null}
    </Pressable>
  );
}
