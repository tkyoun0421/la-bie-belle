import { ScrollView, useWindowDimensions } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { usePersonPickerSheet } from "@/features/scheduleAssign/hooks/usePersonPickerSheet";
import type { PersonPickerSheetInput } from "@/features/scheduleAssign/model/personPickerSheet.type";
import { PersonPickerLine } from "@/features/scheduleAssign/ui/PersonPickerLine";

const SHEET_HEIGHT_RATIO = 0.7;

export type PersonPickerSheetProps = PersonPickerSheetInput & {
  title: string;
  sending: boolean;
  onExpand: () => void;
  onSend: () => void;
};

export function PersonPickerSheet({
  title,
  sending,
  onExpand,
  onSend,
  ...input
}: PersonPickerSheetProps) {
  const { height } = useWindowDimensions();
  const picker = usePersonPickerSheet(input);

  return (
    <>
      <Text size="lg" weight="bold">
        {title}
      </Text>

      <ScrollView style={{ maxHeight: height * SHEET_HEIGHT_RATIO }}>
        {picker.assignable.length === 0 ? (
          <Text size="sm" tone="muted" className="py-3">
            지금 바로 넣을 수 있는 사람이 없어요
          </Text>
        ) : (
          picker.assignable.map((line) => (
            <PersonPickerLine key={line.profileId} line={line} />
          ))
        )}

        {picker.showRest ? (
          picker.rest.map((line) => (
            <PersonPickerLine key={line.profileId} line={line} />
          ))
        ) : (
          <Button variant="ghost" onPress={onExpand}>
            전체 보기
          </Button>
        )}
      </ScrollView>

      {picker.sendLabel === null ? null : (
        <Button className="mt-3" loading={sending} onPress={onSend}>
          {picker.sendLabel}
        </Button>
      )}
    </>
  );
}
