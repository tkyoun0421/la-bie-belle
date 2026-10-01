import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import { isValidPhone } from "@/features/profile/model/validateProfile";
import { canSaveContact } from "@/screens/profile/model/canSaveContact";

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

const PHONE_LENGTH = 11;

const SAVE_FAILED = "보내지 못했어요. 다시 시도해주세요";

const INVALID_PHONE = "010으로 시작하는 11자리를 적어 주세요";

function digitsOnly(typed: string): string {
  return typed.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

export type ContactSheetProps = {
  phone: string;
  saving: boolean;
  failed: boolean;
  rejected: boolean;
  onClose: () => void;
  onSave: (phone: string) => void;
};

export function ContactSheet({
  phone,
  saving,
  failed,
  rejected,
  onClose,
  onSave,
}: ContactSheetProps) {
  const [draft, setDraft] = useState(phone);

  const malformed = draft.length === PHONE_LENGTH && !isValidPhone(draft);

  return (
    <>
      <Text size="lg" weight="semibold">
        연락처
      </Text>

      <Input
        className="mt-6"
        label="휴대폰 번호"
        placeholder="01012345678"
        keyboardType="number-pad"
        autoFocus
        value={draft}
        maxLength={PHONE_LENGTH}
        error={malformed || rejected ? INVALID_PHONE : undefined}
        onChangeText={(typed) => setDraft(digitsOnly(typed))}
      />

      {malformed || rejected ? null : (
        <Text size="sm" tone="subtle" className="mt-2">
          숫자만 적으면 돼요
        </Text>
      )}

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
          disabled={!canSaveContact(phone, draft)}
          onPress={() => onSave(draft)}
        >
          저장
        </Button>
      </View>
    </>
  );
}
