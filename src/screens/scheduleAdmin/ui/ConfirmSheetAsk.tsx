import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { CONFIRM_SHEET_BUTTON_TEST_ID } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { ConfirmSheetVacancy } from "@/screens/scheduleAdmin/model/confirmSheet.type";

export type ConfirmSheetAskProps = {
  title: string;
  buttonLabel: string;
  vacancy: ConfirmSheetVacancy | null;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmSheetAsk({
  title,
  buttonLabel,
  vacancy,
  confirming,
  onClose,
  onConfirm,
}: ConfirmSheetAskProps) {
  return (
    <>
      <Text size="lg" weight="bold">
        {title}
      </Text>

      {vacancy === null ? null : (
        <NoticeBlock kind="warning" className="mt-4">
          <Text size="sm" weight="medium">
            {vacancy.headLine}
          </Text>
          {vacancy.itemLines.map((line) => (
            <Text key={line} size="sm">
              {`\n${line}`}
            </Text>
          ))}
          {vacancy.overflowLine === null ? null : (
            <Text size="sm" tone="muted">
              {`\n${vacancy.overflowLine}`}
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
          testID={CONFIRM_SHEET_BUTTON_TEST_ID}
          loading={confirming}
          onPress={onConfirm}
        >
          {buttonLabel}
        </Button>
      </View>
    </>
  );
}
