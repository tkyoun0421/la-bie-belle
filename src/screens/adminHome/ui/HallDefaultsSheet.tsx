import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";

/**
 * 근무 시간 기본값을 고치는 시트다. 정본은
 * `docs/2-design/system/screens/adminHome.md`의 「기본값 시트」다.
 *
 * **바꿔도 이미 연 날은 그대로다.** 연 날의 근무 시간은 열던 순간 깔린 값이고 소급해서
 * 덮으면 이미 손본 날까지 되돌아간다 — 도움말이 그 말을 한다.
 *
 * 저장이 실패하면 시트를 안 닫는다 — 적은 값이 사라지면 다시 적어야 한다. 적는 값을 이
 * 조각이 안 드는 것은 그래서다: 넘어진 뒤에도 남아야 하는 값은 통신을 아는 자리가 들어야
 * 한다([`useAdminHomeScreen`](../hooks/useAdminHomeScreen.ts)).
 */

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type HallDefaultsSheetProps = {
  starts: string;
  ends: string;
  saving: boolean;
  failed: boolean;
  onStarts: (typed: string) => void;
  onEnds: (typed: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function HallDefaultsSheet({
  starts,
  ends,
  saving,
  failed,
  onStarts,
  onEnds,
  onClose,
  onSave,
}: HallDefaultsSheetProps) {
  return (
    <>
      <Text size="lg" weight="semibold">
        근무 시간 기본값
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Input
          className="flex-1"
          label="출근"
          testID="hall-defaults-start-input"
          placeholder="10:00"
          value={starts}
          onChangeText={onStarts}
        />
        <Input
          className="flex-1"
          label="퇴근"
          testID="hall-defaults-end-input"
          placeholder="19:00"
          value={ends}
          onChangeText={onEnds}
        />
      </View>

      <Text size="sm" tone="subtle" className="mt-2">
        날을 열면 이 시간이 깔려요. 이미 연 날은 그대로예요
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
          onPress={onSave}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
