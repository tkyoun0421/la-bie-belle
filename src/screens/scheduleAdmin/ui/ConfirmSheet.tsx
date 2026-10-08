import { CircleCheck, CircleX } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { formatMonthName } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import {
  openSlotLine,
  summarizeOpenSlots,
  type OpenSlotRow,
} from "@/screens/scheduleAdmin/utils/groupOpenSlots.utils";

const RESULT_STAY_MS = 1650;

const RESULT_ICON_SIZE = 48;

export type ConfirmSheetProps = {
  month: string;
  openSlots: readonly OpenSlotRow[];
  notifiedCount: number;
  confirming: boolean;
  done: boolean;
  failed: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmSheet({
  month,
  openSlots,
  notifiedCount,
  confirming,
  done,
  failed,
  onClose,
  onConfirm,
}: ConfirmSheetProps) {
  useEffect(() => {
    if (!done) {
      return;
    }

    const timer = setTimeout(onClose, RESULT_STAY_MS);

    return () => clearTimeout(timer);
  }, [done, onClose]);

  const monthName = formatMonthName(month);

  if (done) {
    return (
      <View className="items-center gap-3 py-4">
        <Icon icon={CircleCheck} size={RESULT_ICON_SIZE} />
        <Text size="lg" weight="bold">
          {`${monthName} 근무표를 확정했어요`}
        </Text>
        <Text size="sm" tone="muted">
          {`배정된 ${notifiedCount}명에게 알림을 보냈어요`}
        </Text>
      </View>
    );
  }

  if (failed) {
    return (
      <>
        <View className="items-center gap-3 py-4">
          <Icon icon={CircleX} size={RESULT_ICON_SIZE} />
          <Text size="lg" weight="bold">
            확정하지 못했어요
          </Text>
          <Text size="sm" tone="muted">
            근무표는 그대로 있어요 · 다시 해볼게요
          </Text>
        </View>

        <Button
          variant="primary"
          testID="schedule-confirm-sheet-button"
          loading={confirming}
          onPress={onConfirm}
        >
          다시 확정하기
        </Button>
      </>
    );
  }

  const summary = summarizeOpenSlots(openSlots);

  return (
    <>
      <Text size="lg" weight="bold">
        {`${monthName} 근무표를 확정할까요?`}
      </Text>

      {summary.totalCount === 0 ? null : (
        <NoticeBlock kind="warning" className="mt-4">
          <Text size="sm" weight="medium">
            {`빈 자리 ${summary.totalCount}개가 있어요`}
          </Text>
          {summary.items.map((item) => (
            <Text key={`${item.workDate}-${item.position}`} size="sm">
              {`\n${openSlotLine(item)}`}
            </Text>
          ))}
          {summary.overflowCount === 0 ? null : (
            <Text size="sm" tone="muted">
              {`\n외 ${summary.overflowCount}개`}
            </Text>
          )}
          <Text size="sm" tone="muted">
            {"\n빈 자리는 확정 뒤에도 채울 수 있어요"}
          </Text>
        </NoticeBlock>
      )}

      <Text size="sm" tone="muted" className="mt-4">
        확정하면 근무자 전원에게 보여요 · 되돌릴 수 없어요
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={confirming}
          onPress={onClose}
        >
          닫기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          testID="schedule-confirm-sheet-button"
          loading={confirming}
          onPress={onConfirm}
        >
          {`${monthName} 근무표 확정하기`}
        </Button>
      </View>
    </>
  );
}
