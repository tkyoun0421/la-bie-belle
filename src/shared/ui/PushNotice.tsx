import { CircleCheck } from "lucide-react-native";
import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

/**
 * 알림을 켜는 자리에 서는 안내 면이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「알림 영역의 세 모습」과 「승인 대기
 * 색·글자·여백과 모양」이고, 「나」 화면의 알림 안내도 같은 면을 쓴다
 * (`docs/2-design/modules/account/screens/profile.md`의 「프로필 여백과 모양」).
 *
 * **면 셋이 상태를 나른다.** 아직 안 켬은 `bg.neutral-weak`, 켠 뒤는 `bg.positive-weak`,
 * 거부한 뒤는 `bg.sky-weak`다. 아직 안 켬이 [알림 블록](NoticeBlock.tsx)의 넷 어디에도 안 드는
 * 것은 그 자리가 아직 아무 일도 안 일어난 자리라서다.
 *
 * **글자에는 색을 안 입힌다.** 뜻은 면과 아이콘이 나르고 제목은 읽히는 데만 집중한다. 아이콘이
 * 서는 것은 켠 뒤 하나뿐이고 나머지는 제목이 상태를 말한다.
 *
 * **왼쪽 정렬이다.** 승인 대기 화면의 나머지는 다 가운데인데 여기만 왼쪽으로 붙는다 — 여러
 * 줄을 가운데로 맞추면 줄마다 시작점이 달라져 읽는 눈이 매번 자리를 다시 찾는다.
 *
 * 안쪽은 눈금 둘로만 짠다. 붙어 있는 것끼리는 `2`, 성격이 갈리는 자리에는 `4`다.
 *
 * 체크 아이콘 크기는 정본의 표에 없다 — 아이콘은 옆 글자 크기를 따라가고
 * (`docs/2-design/design-system/components.md`의 「아이콘」) 제목이 `text-sm`이라 본문 옆
 * 20px에서 그만큼 내린 값이다.
 */

const CHECK_ICON_SIZE = 18;

export type PushNoticeTone = "idle" | "enabled" | "denied";

const SURFACES: Record<PushNoticeTone, string> = {
  idle: "bg-bg-neutral-weak",
  enabled: "bg-bg-positive-weak",
  denied: "bg-bg-sky-weak",
};

export type PushNoticeProps = ViewProps & {
  tone: PushNoticeTone;
  title: string;
  subline: string;
  action?: ReactNode;
  testID?: string;
};

export function PushNotice({
  tone,
  title,
  subline,
  action,
  className,
  testID,
  ...rest
}: PushNoticeProps) {
  return (
    <View
      testID={testID}
      className={cn("w-full rounded-lg p-4", SURFACES[tone], className)}
      {...rest}
    >
      <View className="flex-row items-center gap-2">
        {tone === "enabled" ? (
          <Icon icon={CircleCheck} size={CHECK_ICON_SIZE} tone="positive" />
        ) : null}
        <Text size="sm" weight="semibold" className="flex-1">
          {title}
        </Text>
      </View>
      <Text size="xs" tone="muted" className="mt-2">
        {subline}
      </Text>
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
