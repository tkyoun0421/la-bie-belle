import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";

/**
 * 채워진 자리를 누르면 서는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「포지션과 자리」와 「확정 뒤
 * 날 상세」다.
 *
 * **확정 전과 뒤에서 가운데 줄의 이름이 갈린다.** 확정 전은 「자리 비우기」고 확정 뒤는
 * 「사람 빼기」다 — 확정 전에는 관리자 혼자의 일이라 확인이 없고, 확정 뒤에는 그 사람의
 * 근무가 없어지는 사건이라 확인 시트가 한 겹 더 선다.
 *
 * **겸임 자리에만 「자리 나누기」가 있다.** 끌어서 되돌리는 길은 버리기와 손짓이 겹쳐 안
 * 만들었다.
 */

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
