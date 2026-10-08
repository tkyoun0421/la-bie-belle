import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import type { RequestSheetState } from "@/screens/scheduleWorker/model/requestSheet.policy";

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
