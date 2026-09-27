import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";

/**
 * 스케줄 신청 마감일을 바꾸는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「근무 신청 모아보기 짜임」이다.
 *
 * **문이 둘이고 시트는 하나다.** 모아보기의 「마감일 바꾸기」와 확정 잠김의 「마감일 당기기」가
 * 같은 것을 연다 — 당길 일이 생기는 자리가 둘이라서다. 그 둘이 다른 슬라이스에 살아
 * (`applications`와 `schedule-admin`) 시트는 슬라이스 밖인 이 층에 선다.
 *
 * 경고 줄이 누르기 전에 알림이 나간다는 것을 말한다(SCH-007).
 */

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type DeadlineSheetProps = {
  deadline: string;
  today: string;
  saving: boolean;
  failed: boolean;
  onClose: () => void;
  onSave: (deadline: string) => void;
};

export function DeadlineSheet({
  deadline,
  today,
  saving,
  failed,
  onClose,
  onSave,
}: DeadlineSheetProps) {
  const [draft, setDraft] = useState(deadline);

  return (
    <>
      <Text size="lg" weight="bold">
        스케줄 신청 마감일
      </Text>

      <Input
        className="mt-6"
        testID="schedule-deadline-input"
        placeholder={today}
        autoCapitalize="none"
        value={draft}
        onChangeText={setDraft}
      />

      <Text size="sm" tone="subtle" className="mt-2">
        오늘 이전은 고를 수 없어요
      </Text>

      <Text size="sm" tone="muted" className="mt-4">
        바꾸면 전원에게 알림이 가요
      </Text>

      {failed ? (
        <Text size="sm" tone="critical" className="mt-2">
          {SAVE_FAILED}
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          닫기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={saving}
          disabled={draft < today}
          onPress={() => onSave(draft)}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
