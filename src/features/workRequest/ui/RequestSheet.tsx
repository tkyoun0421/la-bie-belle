import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";
import { useRequestSheet } from "@/features/workRequest/hooks/useRequestSheet";

export type RequestSheetProps = {
  request: SlotRequest;
  onAnswered: () => void;
  onSeatTaken: (line: string) => void;
};

export function RequestSheet(props: RequestSheetProps) {
  const fragment = useRequestSheet(props);
  const ended = fragment.state === "ended";

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text size="base" weight="semibold">
          {ended ? "근무 요청이 끝났어요" : "근무 요청이 왔어요"}
        </Text>
        <Text size="xs" tone="subtle" numeric>
          {fragment.subtitle}
        </Text>
      </View>

      <Text size="sm" tone="muted">
        {ended ? "자리가 찼거나 기간이 지났어요" : "바로 배정돼요"}
      </Text>

      {fragment.failedLine === null ? null : (
        <NoticeBlock kind="error" className="p-4">
          {fragment.failedLine}
        </NoticeBlock>
      )}

      {ended ? null : (
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={fragment.sending}
            onPress={fragment.decline}
          >
            어려워요
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={fragment.sending}
            onPress={fragment.accept}
          >
            근무할게요
          </Button>
        </View>
      )}
    </View>
  );
}
