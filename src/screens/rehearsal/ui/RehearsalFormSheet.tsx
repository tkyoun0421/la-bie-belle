import { Pressable, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { COUNT_MAX_LENGTH } from "@/screens/rehearsal/consts/rehearsal.const";
import {
  canSubmitForm,
  type AddSheetState,
  type AddSheetValues,
} from "@/screens/rehearsal/model/addSheetState.reducer";

const TIME_GUIDE = "이 날은 근무가 없어서 시각으로 넣어요";

const COUNT_GUIDE = "이 날은 근무가 있어서 건수로 넣어요 · 1건은 1시간이에요";

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
