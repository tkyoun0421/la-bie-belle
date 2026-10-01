import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import type { RequestSheetState } from "@/screens/schedule-worker/model/requestSheet";

/**
 * 관리자가 보낸 근무 요청에 답하는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-worker.md`의 「근무 요청 시트 짜임」이다.
 *
 * **제목이 「근무 요청이 왔어요」다.** 교대·취소 시트처럼 하려는 일의 이름을 달면 내가 요청을
 * 보내는 화면으로 읽힌다 — 이 시트는 받은 것에 답하는 자리다.
 *
 * **끝난 요청은 답할 자리가 없다.** 자리가 찼거나 기간이 지난 요청을 알림으로 열면 제목이
 * 상태를 맡고 버튼 둘이 빠진다. 부제는 그대로 둔다 — 어느 요청이 끝난 것인지는 여전히
 * 알아야 한다.
 *
 * **버튼이 「수락」·「거절」이 아니다.** 심사하는 사람의 말이라 답하는 부담을 키운다
 * ([writing.md](../../../../docs/2-design/design-system/writing.md)의 예외 조항).
 */

export type RequestSheetProps = {
  subtitle: string;
  state: RequestSheetState;
  sending: boolean;
  failed: boolean;
  onDecline: () => void;
  onAccept: () => void;
};

export function RequestSheet({
  subtitle,
  state,
  sending,
  failed,
  onDecline,
  onAccept,
}: RequestSheetProps) {
  const ended = state === "ended";

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text size="base" weight="semibold">
          {ended ? "근무 요청이 끝났어요" : "근무 요청이 왔어요"}
        </Text>
        <Text size="xs" tone="subtle" numeric>
          {subtitle}
        </Text>
      </View>

      <Text size="sm" tone="muted">
        {ended ? "자리가 찼거나 기간이 지났어요" : "바로 배정돼요"}
      </Text>

      {failed ? (
        <NoticeBlock kind="error" className="p-4">
          보내지 못했어요. 다시 시도해주세요
        </NoticeBlock>
      ) : null}

      {ended ? null : (
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={sending}
            onPress={onDecline}
          >
            어려워요
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={sending}
            onPress={onAccept}
          >
            근무할게요
          </Button>
        </View>
      )}
    </View>
  );
}
