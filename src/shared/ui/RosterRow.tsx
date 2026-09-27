import { View } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/Badge";
import { Text } from "@/shared/ui/Text";

/**
 * 그날 나가는 사람 하나가 서는 줄이다. 정본은
 * `docs/2-design/design-system/components.md`의 「명단 줄」이고, 근무표의 날 시트와 포지션 순
 * 펼침이 같은 줄을 쓴다.
 *
 * **[ListRow](ListRow.tsx)와 다른 조각이다.** 저쪽은 눌러서 어디로 가는 목록 줄이고 이쪽은
 * 누를 데가 없는 표의 한 행이다 — 글자도 한 단계 작고, 왼쪽에 포지션 열이 따로 선다.
 *
 * **포지션 이름은 첫 줄에만 선다.** 한 포지션에 여럿이면 아래 줄은 이름만 서고 열은 비어
 * 있는다 — 열 폭이 고정이라 이름이 같은 자리에서 시작한다.
 *
 * **인증 상태는 모든 줄에서 같은 자리다.** 눈이 한 열로 훑어야 해서 「나」가 그 왼쪽에 서고
 * 상태가 오른쪽 끝을 잡는다. 창이 열리기 전에는 `status`가 안 와서 열이 통째로 없다.
 *
 * **`badge`는 그 줄에 걸린 요청을 말한다** — 「취소 요청 중」·「교대 요청 중」이다. 교육
 * 배지가 그 사람이 무엇인지를 말하는 것과 달리 이쪽은 지금 무슨 답을 기다리는지라 「나」
 * 옆에 붙는다.
 */

const POSITION_COLUMN_WIDTH = 56;

const STATUS_COLUMN_WIDTH = 92;

export type RosterRowProps = {
  position?: string;
  name?: string;
  training?: boolean;
  mine?: boolean;
  badge?: string;
  status?: string;
  divider?: boolean;
  testID?: string;
};

export function RosterRow({
  position,
  name,
  training = false,
  mine = false,
  badge,
  status,
  divider = false,
  testID,
}: RosterRowProps) {
  return (
    <View
      testID={testID}
      className={cn(
        "flex-row items-center gap-2 px-2 py-2.5",
        mine && "rounded-sm bg-bg-brand-weak",
        divider && "border-t border-stroke-neutral",
      )}
    >
      <View style={{ width: POSITION_COLUMN_WIDTH }}>
        <Text size="xs" tone="subtle">
          {position ?? ""}
        </Text>
      </View>

      <View className="flex-1 flex-row items-center gap-1.5">
        {name === undefined ? (
          <Text size="sm" tone="subtle">
            빈 자리
          </Text>
        ) : (
          <Text size="sm">{name}</Text>
        )}
        {training ? <Badge variant="neutral" label="교육" /> : null}
      </View>

      {mine ? (
        <Text size="sm" tone="brand">
          나
        </Text>
      ) : null}

      {badge === undefined ? null : <Badge variant="neutral" label={badge} />}

      {status === undefined ? null : (
        <View style={{ width: STATUS_COLUMN_WIDTH }}>
          <Text size="xs" tone="muted" numeric className="text-right">
            {status}
          </Text>
        </View>
      )}
    </View>
  );
}
