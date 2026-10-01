import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import { isDayHoursSaveEnabled } from "@/screens/schedule-admin/model/dayHoursForm";

/**
 * 그날 근무 시간을 고치는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「날 상세 짜임」이고 문안은
 * 같은 문서 「날 상세 문안」의 「근무 시간 시트」 행이다.
 *
 * **이 값은 그날 배정된 전원에게 같이 걸린다.** 사람마다 어긋난 자리는 근무 조정이 담는다 —
 * 도움말이 그 경계를 말한다.
 */

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type DayHoursSheetProps = {
  starts: string;
  ends: string;
  saving: boolean;
  failed: boolean;
  onClose: () => void;
  onSave: (input: { starts: string; ends: string }) => void;
};

export function DayHoursSheet({
  starts,
  ends,
  saving,
  failed,
  onClose,
  onSave,
}: DayHoursSheetProps) {
  const [draftStarts, setDraftStarts] = useState(starts);
  const [draftEnds, setDraftEnds] = useState(ends);

  return (
    <>
      <Text size="lg" weight="bold">
        근무 시간
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Input
          className="flex-1"
          label="출근"
          testID="day-hours-start-input"
          placeholder="10:00"
          value={draftStarts}
          onChangeText={setDraftStarts}
        />
        <Input
          className="flex-1"
          label="퇴근"
          testID="day-hours-end-input"
          placeholder="19:00"
          value={draftEnds}
          onChangeText={setDraftEnds}
        />
      </View>

      <Text size="sm" tone="subtle" className="mt-2">
        이 날 배정된 전원에게 같이 적용돼요
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
          disabled={
            !isDayHoursSaveEnabled({ starts: draftStarts, ends: draftEnds })
          }
          onPress={() => onSave({ starts: draftStarts, ends: draftEnds })}
        >
          바꾸기
        </Button>
      </View>
    </>
  );
}
