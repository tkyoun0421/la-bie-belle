import { ChevronDown, ChevronUp } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";

/**
 * 접었다 펴는 줄이다. 정본은 `docs/2-design/design-system/components.md`의 「아코디언」이고
 * 근무표의 포지션 순 보기가 첫 자리다.
 *
 * **머리 줄이 접힌 채로도 답을 준다.** 제목 왼쪽에 날짜, 오른쪽에 그날 내 상태가 서서 펴지
 * 않고도 훑인다. 펴는 것은 그 뒤에 명단을 더 보려는 사람의 일이다.
 *
 * **여러 줄이 동시에 펴진다.** 하나를 펴면 다른 것이 접히는 방식은 안 쓴다 — 두 날의 명단을
 * 나란히 보려는 사람이 있고, 그 자리에서 접히면 방금 본 것이 사라진다.
 *
 * 줄 사이 선은 이 조각이 제 위에 긋는다. 첫 줄에는 안 긋는다 — 카드 맨 위에 선이 서면 카드
 * 테두리처럼 읽힌다.
 */

const CHEVRON_SIZE = 16;

export type AccordionRowProps = {
  title: string;
  status?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  divider?: boolean;
  children?: ReactNode;
  testID?: string;
};

export function AccordionRow({
  title,
  status,
  expanded,
  onToggle,
  divider = false,
  children,
  testID,
}: AccordionRowProps) {
  return (
    <View className={cn(divider && "border-t border-stroke-neutral")}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        className="flex-row items-center gap-2 py-4"
      >
        <Text size="sm" weight="medium" className="flex-1">
          {title}
        </Text>
        {status}
        <Icon
          icon={expanded ? ChevronUp : ChevronDown}
          size={CHEVRON_SIZE}
          className="text-fg-neutral-subtle"
        />
      </Pressable>
      {expanded ? <View className="pb-4">{children}</View> : null}
    </View>
  );
}
