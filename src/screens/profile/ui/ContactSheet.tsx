import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import {
  CONTACT_SHEET_COPY,
  PHONE_LENGTH,
} from "@/screens/profile/consts/profile.const";

/**
 * 연락처를 고치는 시트다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「연락처 고치기」다.
 *
 * **숫자만 받는다.** 하이픈은 사람이 안 치고 화면이 끊어 넣는다. 그래서 이 안에서 오가는
 * 값은 전부 숫자 열한 자리고, 하이픈은 저장할 때 한 번 붙는다.
 *
 * **쓰는 중에는 틀렸다고 말하지 않는다.** 열한 자리를 다 채우기 전까지는 아래 도움말만
 * 서고, 다 채웠는데도 꼴이 안 맞을 때 오류가 선다
 * (`docs/2-design/design-system/components.md`의 「Input」).
 *
 * 저장이 실패하면 시트를 안 닫는다 — 적은 값이 사라지면 다시 적어야 한다.
 */

export type ContactSheetProps = {
  draft: string;
  saving: boolean;
  failed: boolean;
  invalid: boolean;
  canSave: boolean;
  onWrite: (typed: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function ContactSheet({
  draft,
  saving,
  failed,
  invalid,
  canSave,
  onWrite,
  onClose,
  onSave,
}: ContactSheetProps) {
  return (
    <>
      <Text size="lg" weight="semibold">
        {CONTACT_SHEET_COPY.title}
      </Text>

      <Input
        className="mt-6"
        label={CONTACT_SHEET_COPY.inputLabel}
        placeholder={CONTACT_SHEET_COPY.placeholder}
        keyboardType="number-pad"
        autoFocus
        value={draft}
        maxLength={PHONE_LENGTH}
        error={invalid ? CONTACT_SHEET_COPY.invalid : undefined}
        onChangeText={onWrite}
      />

      {invalid ? null : (
        <Text size="sm" tone="subtle" className="mt-2">
          {CONTACT_SHEET_COPY.guide}
        </Text>
      )}

      {failed ? (
        <Text size="sm" tone="critical" className="mt-2">
          {CONTACT_SHEET_COPY.sendFailed}
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {CONTACT_SHEET_COPY.close}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={saving}
          disabled={!canSave}
          onPress={onSave}
        >
          {CONTACT_SHEET_COPY.save}
        </Button>
      </View>
    </>
  );
}
