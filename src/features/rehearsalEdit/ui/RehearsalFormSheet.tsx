import { Pressable, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { COUNT_MAX_LENGTH } from "@/features/rehearsalEdit/consts/rehearsalEdit.const";
import { useRehearsalFormSheet } from "@/features/rehearsalEdit/hooks/useRehearsalFormSheet";
import type { RehearsalFormSheetInput } from "@/features/rehearsalEdit/model/rehearsalFormSheet.type";

export type RehearsalFormSheetProps = RehearsalFormSheetInput & {
  onClose: () => void;
  onRemove?: () => void;
};

export function RehearsalFormSheet({
  onClose,
  onRemove,
  ...input
}: RehearsalFormSheetProps) {
  const form = useRehearsalFormSheet(input);

  return (
    <View>
      <Text size="lg" weight="semibold">
        {form.title}
      </Text>

      {form.wrongKindNotice ? (
        <NoticeBlock kind="info" className="mt-4">
          {form.wrongKindNotice}
        </NoticeBlock>
      ) : null}

      {form.formKind === "time" ? (
        <View className="mt-4 flex-row gap-3">
          <Input
            className="flex-1"
            label="시작"
            testID="rehearsal-starts-input"
            value={form.values.startsAt}
            onChangeText={(startsAt) => form.change({ startsAt })}
          />
          <Input
            className="flex-1"
            label="끝"
            testID="rehearsal-ends-input"
            value={form.values.endsAt}
            onChangeText={(endsAt) => form.change({ endsAt })}
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
            value={form.values.count}
            onChangeText={(count) => form.change({ count })}
          />
          <Text size="sm" tone="subtle" className="pb-3">
            건
          </Text>
        </View>
      )}

      <Text size="xs" tone="subtle" className="mt-2">
        {form.guide}
      </Text>

      {form.overlapsNotice ? (
        <Text size="xs" tone="critical" className="mt-2">
          {form.overlapsNotice}
        </Text>
      ) : null}

      {form.transportNotice ? (
        <NoticeBlock kind="error" className="mt-4">
          {form.transportNotice}
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
            loading={form.saving}
            disabled={!form.canSubmit}
            onPress={form.submit}
          >
            {form.submitLabel}
          </Button>
        </View>
      </View>
    </View>
  );
}
