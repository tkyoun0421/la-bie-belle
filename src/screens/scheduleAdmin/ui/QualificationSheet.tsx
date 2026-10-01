import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";

/**
 * 제한 포지션에 교육 이력 없는 사람을 눌렀을 때 시트 내용이 바뀌어 서는 선택지다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「자격 없는 사람」이다.
 *
 * **버튼 둘이 아니라 줄 둘에 닫기다.** 같은 무게의 갈림길 둘이라 한쪽을 primary로 올리면
 * 화면이 답을 정해주는 것이 되는데, 이 결정은 관리자의 것이다(SCH-013).
 */

export type QualificationSheetProps = {
  name: string;
  position: string;
  onOnce: () => void;
  onGrant: () => void;
  onClose: () => void;
};

export function QualificationSheet({
  name,
  position,
  onOnce,
  onGrant,
  onClose,
}: QualificationSheetProps) {
  return (
    <>
      <Text size="lg" weight="bold">
        {`${name} 님은 ${position} 교육 이력이 없어요`}
      </Text>

      <ListRow
        className="mt-4"
        title="이번만 넣기"
        detail="이 자리에만 넣어요"
        divider
        onPress={onOnce}
      />
      <ListRow
        title="자격도 주기"
        detail={`앞으로 ${position} 자리에 들어갈 수 있어요`}
        onPress={onGrant}
      />

      <Button variant="secondary" className="mt-4" onPress={onClose}>
        닫기
      </Button>
    </>
  );
}
