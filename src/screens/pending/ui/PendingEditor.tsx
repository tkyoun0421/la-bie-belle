import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Segment } from "@/shared/ui/Segment";
import { Text } from "@/shared/ui/Text";
import {
  GENDER_OPTIONS,
  PENDING_AVATAR_SIZE,
  PENDING_FORM_COPY,
} from "@/screens/pending/consts/pending.const";
import type { PendingScreenController } from "@/screens/pending/hooks/usePendingScreen";

export type PendingEditorProps = {
  screen: PendingScreenController;
};

export function PendingEditor({ screen }: PendingEditorProps) {
  if (screen.open === "photo") {
    return (
      <View className="mb-4 items-center">
        <Pressable
          accessibilityRole="button"
          disabled={screen.uploading}
          onPress={() => void screen.pickPhoto()}
        >
          <Avatar
            name={screen.name}
            photoUrl={screen.photoUrl}
            size={PENDING_AVATAR_SIZE}
          />
        </Pressable>
        <Button
          variant="outline"
          size="md"
          className="mt-4"
          loading={screen.uploading}
          onPress={screen.freezePhoto}
        >
          {PENDING_FORM_COPY.useDefaultPhoto}
        </Button>
        {screen.photoFailed ? (
          <Text size="xs" tone="critical" className="mt-1.5">
            {PENDING_FORM_COPY.photoFailed}
          </Text>
        ) : null}
      </View>
    );
  }

  if (screen.open === "name") {
    return (
      <Input
        className="mb-4"
        label={PENDING_FORM_COPY.nameLabel}
        placeholder={PENDING_FORM_COPY.namePlaceholder}
        value={screen.values.name}
        returnKeyType="done"
        onChangeText={screen.writeName}
        onSubmitEditing={screen.submitName}
      />
    );
  }

  if (screen.open === "gender") {
    return (
      <View className="mb-4">
        <Text size="xs" tone="muted" className="mb-1.5">
          {PENDING_FORM_COPY.genderLabel}
        </Text>
        <Segment
          options={[...GENDER_OPTIONS]}
          value={screen.genderValue}
          onChange={screen.chooseGender}
        />
      </View>
    );
  }

  if (screen.open === "birthDate") {
    return (
      <Input
        className="mb-4"
        label={PENDING_FORM_COPY.birthDateLabel}
        placeholder={PENDING_FORM_COPY.birthDatePlaceholder}
        keyboardType="number-pad"
        value={screen.values.birthDate}
        error={screen.birthDateGuide}
        onBlur={() => screen.touch("birthDate")}
        onChangeText={screen.writeBirthDate}
      />
    );
  }

  if (screen.open === "phone") {
    return (
      <Input
        className="mb-4"
        label={PENDING_FORM_COPY.phoneLabel}
        placeholder={PENDING_FORM_COPY.phonePlaceholder}
        keyboardType="number-pad"
        value={screen.values.phone}
        error={screen.phoneGuide}
        onBlur={() => screen.touch("phone")}
        onChangeText={screen.writePhone}
      />
    );
  }

  return null;
}
