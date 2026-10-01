import { Pressable, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import {
  canSubmitForm,
  type AddSheetState,
  type AddSheetValues,
} from "@/screens/rehearsal/model/addSheetState";

/**
 * 리허설을 넣고 고치는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/rehearsal.md`의 「넣는 시트 짜임」과 「고치는 시트
 * 짜임」이고, 넣기와 고치기가 한 조각인 것은 그 문서가 「넣는 시트와 같고 값이 든 채로
 * 열린다」고 정해서다.
 *
 * **날짜 칸이 없다.** 달력에서 이미 골랐다 — 날짜를 시트 안에 들이면 달력에서 고른 것이
 * 무엇이었는지가 흐려지고, 고친 날짜의 갈래가 다를 때 칸이 통째로 바뀌는 처리가 다시
 * 필요해진다.
 *
 * **갈래가 열릴 때 이미 정해져 있다.** 라디오도 탭도 없다. 고를 수 있게 만들면 배정이 있는
 * 날에 시각으로 넣어 근무 시간과 겹치는 시간이 두 번 세어진다.
 *
 * **거절이 시트를 안 닫는다.** 갈래 어긋남은 알림 한 줄을 세우고 칸만 바꿔 다시 받는다 —
 * 고른 날짜는 그대로다. 겹침과 저장 실패는 넣던 값을 그대로 둔다.
 *
 * 알림 자리 둘이 [알림 블록](../../../shared/ui/NoticeBlock.tsx)인 것은 화면 파일이 면을
 * 직접 칠하지 못해서다(규칙 19).
 */

const TIME_GUIDE = "이 날은 근무가 없어서 시각으로 넣어요";

const COUNT_GUIDE = "이 날은 근무가 있어서 건수로 넣어요 · 1건은 1시간이에요";

const COUNT_MAX_LENGTH = 1;

export type RehearsalFormSheetProps = {
  mode: "add" | "edit";
  dateLabel: string;
  state: AddSheetState;
  saving: boolean;
  onChange: (values: Partial<AddSheetValues>) => void;
  onSubmit: () => void;
  onClose: () => void;
  onRemove?: () => void;
};

export function RehearsalFormSheet({
  mode,
  dateLabel,
  state,
  saving,
  onChange,
  onSubmit,
  onClose,
  onRemove,
}: RehearsalFormSheetProps) {
  const { formKind, values, notice } = state;
  const adding = mode === "add";

  return (
    <View>
      <Text size="lg" weight="semibold">
        {`${adding ? "리허설 넣기" : "리허설 고치기"} · ${dateLabel}`}
      </Text>

      {notice?.kind === "wrong_kind" ? (
        <NoticeBlock kind="info" className="mt-4">
          {notice.message}
        </NoticeBlock>
      ) : null}

      {formKind === "time" ? (
        <View className="mt-4 flex-row gap-3">
          <Input
            className="flex-1"
            label="시작"
            testID="rehearsal-starts-input"
            value={values.startsAt}
            onChangeText={(startsAt) => onChange({ startsAt })}
          />
          <Input
            className="flex-1"
            label="끝"
            testID="rehearsal-ends-input"
            value={values.endsAt}
            onChangeText={(endsAt) => onChange({ endsAt })}
          />
        </View>
      ) : (
        <View className="mt-4 flex-row items-end gap-3">
          <Input
            className="flex-1"
            label="몇 건"
            testID="rehearsal-count-input"
            keyboardType="number-pad"
            maxLength={COUNT_MAX_LENGTH}
            value={values.count}
            onChangeText={(count) => onChange({ count })}
          />
          <Text size="sm" tone="subtle" className="pb-3">
            건
          </Text>
        </View>
      )}

      <Text size="xs" tone="subtle" className="mt-2">
        {formKind === "time" ? TIME_GUIDE : COUNT_GUIDE}
      </Text>

      {notice?.kind === "overlaps" ? (
        <Text size="xs" tone="critical" className="mt-2">
          {notice.message}
        </Text>
      ) : null}

      {notice?.kind === "transport_error" ? (
        <NoticeBlock kind="error" className="mt-4">
          {`${notice.message}\n${notice.detail}`}
        </NoticeBlock>
      ) : null}

      {onRemove === undefined ? null : (
        <Pressable
          accessibilityRole="button"
          testID="rehearsal-remove-row"
          onPress={onRemove}
          className="mt-4 h-12 justify-center"
        >
          <Text size="sm" weight="medium" tone="critical">
            지우기
          </Text>
        </Pressable>
      )}

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <Button variant="secondary" onPress={onClose}>
            닫기
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="primary"
            loading={saving}
            disabled={!canSubmitForm(state)}
            onPress={onSubmit}
          >
            {adding ? "넣기" : "저장"}
          </Button>
        </View>
      </View>
    </View>
  );
}
