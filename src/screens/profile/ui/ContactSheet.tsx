import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import {
  CONTACT_SHEET_COPY,
  PHONE_LENGTH,
} from "@/screens/profile/consts/profile.const";

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
