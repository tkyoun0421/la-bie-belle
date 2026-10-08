import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";

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
  return (
    <>
      <ListRow title="사람 바꾸기" divider onPress={onReplace} />
      {merged ? (
        <ListRow title="자리 나누기" divider onPress={onSplit} />
      ) : null}
      <ListRow
        title={confirmed ? "사람 빼기" : "자리 비우기"}
        onPress={onRemove}
      />

      <Button variant="secondary" className="mt-4" onPress={onClose}>
        닫기
      </Button>
    </>
  );
}
