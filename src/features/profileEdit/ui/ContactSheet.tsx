import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Text } from "@/shared/ui/Text";
import {
  CONTACT_SHEET_COPY,
  PHONE_LENGTH,
} from "@/features/profileEdit/consts/profileEdit.const";
import { useContactSheet } from "@/features/profileEdit/hooks/useContactSheet";

export type ContactSheetProps = {
  profileId: string;
  phone: string;
  onClose: () => void;
  onSaved: () => void;
};

export function ContactSheet({
  profileId,
  phone,
  onClose,
  onSaved,
}: ContactSheetProps) {
  const fragment = useContactSheet({ profileId, phone, onSaved });

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
        value={fragment.draft}
        maxLength={PHONE_LENGTH}
        error={fragment.invalid ? CONTACT_SHEET_COPY.invalid : undefined}
        onChangeText={fragment.write}
      />

      {fragment.invalid ? null : (
        <Text size="sm" tone="subtle" className="mt-2">
          {CONTACT_SHEET_COPY.guide}
        </Text>
      )}

      {fragment.failedLine === null ? null : (
        <Text size="sm" tone="critical" className="mt-2">
          {fragment.failedLine}
        </Text>
      )}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {CONTACT_SHEET_COPY.close}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={fragment.sending}
          disabled={!fragment.canSave}
          onPress={fragment.save}
        >
          {CONTACT_SHEET_COPY.save}
        </Button>
      </View>
    </>
  );
}
