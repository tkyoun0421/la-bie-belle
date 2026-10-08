import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";

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
