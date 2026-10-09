import { Button } from "@/shared/ui/Button";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { useQualificationSheet } from "@/features/qualificationGrant/hooks/useQualificationSheet";

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
  const sheet = useQualificationSheet({ name, position });

  return (
    <>
      <Text size="lg" weight="bold">
        {sheet.title}
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
        detail={sheet.grantDetail}
        onPress={onGrant}
      />

      <Button variant="secondary" className="mt-4" onPress={onClose}>
        닫기
      </Button>
    </>
  );
}
