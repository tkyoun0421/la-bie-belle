import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";
import { useSlotSheet } from "@/features/scheduleSlot/hooks/useSlotSheet";

export type SlotSheetProps = {
  confirmed: boolean;
  merged: boolean;
  onReplace: () => void;
  onSplit: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export function SlotSheet({
  confirmed,
  merged,
  onReplace,
  onSplit,
  onRemove,
  onClose,
}: SlotSheetProps) {
  const sheet = useSlotSheet({ confirmed, merged });

  return (
    <>
      <ListRow title="사람 바꾸기" divider onPress={onReplace} />
      {sheet.showSplit ? (
        <ListRow title="자리 나누기" divider onPress={onSplit} />
      ) : null}
      <ListRow title={sheet.removeLabel} onPress={onRemove} />

      <Button variant="secondary" className="mt-4" onPress={onClose}>
        닫기
      </Button>
    </>
  );
}
