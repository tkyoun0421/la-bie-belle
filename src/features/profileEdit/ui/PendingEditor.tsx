import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Segment } from "@/shared/ui/Segment";
import { Text } from "@/shared/ui/Text";
import {
  FORM_AVATAR_SIZE,
  GENDER_OPTIONS,
  PROFILE_FORM_COPY,
} from "@/features/profileEdit/consts/profileEdit.const";
import { usePendingEditor } from "@/features/profileEdit/hooks/usePendingEditor";
import type { ProfileFormStep } from "@/features/profileEdit/model/profileFormStep.type";

export type PendingEditorProps = {
  open: ProfileFormStep | null;
  userId: string | null;
  name: string;
  photoUrl: string | null;
  gender: string;
  birthDate: string;
  phone: string;
  birthDateGuide: string | undefined;
  phoneGuide: string | undefined;
  onPhotoDone: () => void;
  onWriteName: (typed: string) => void;
  onSubmitName: () => void;
  onChooseGender: (picked: string) => void;
  onWriteBirthDate: (typed: string) => void;
  onWritePhone: (typed: string) => void;
  onTouch: (step: ProfileFormStep) => void;
};

export function PendingEditor({
  open,
  userId,
  name,
  photoUrl,
  gender,
  birthDate,
  phone,
  birthDateGuide,
  phoneGuide,
  onPhotoDone,
  onWriteName,
  onSubmitName,
  onChooseGender,
  onWriteBirthDate,
  onWritePhone,
  onTouch,
}: PendingEditorProps) {
  const fragment = usePendingEditor({ userId, onUploaded: onPhotoDone });

  if (open === "photo") {
    return (
      <View className="mb-4 items-center">
        <Pressable
          accessibilityRole="button"
          disabled={fragment.uploading}
          onPress={() => void fragment.pick()}
        >
          <Avatar name={name} photoUrl={photoUrl} size={FORM_AVATAR_SIZE} />
        </Pressable>
        <Button
          variant="outline"
          size="md"
          className="mt-4"
          loading={fragment.uploading}
          onPress={onPhotoDone}
        >
          {PROFILE_FORM_COPY.useDefaultPhoto}
        </Button>
        {fragment.failed ? (
          <Text size="xs" tone="critical" className="mt-1.5">
            {PROFILE_FORM_COPY.photoFailed}
          </Text>
        ) : null}
      </View>
    );
  }

  if (open === "name") {
    return (
      <Input
        className="mb-4"
        label={PROFILE_FORM_COPY.nameLabel}
        placeholder={PROFILE_FORM_COPY.namePlaceholder}
        value={name}
        returnKeyType="done"
        onChangeText={onWriteName}
        onSubmitEditing={onSubmitName}
      />
    );
  }

  if (open === "gender") {
    return (
      <View className="mb-4">
        <Text size="xs" tone="muted" className="mb-1.5">
          {PROFILE_FORM_COPY.genderLabel}
        </Text>
        <Segment
          options={[...GENDER_OPTIONS]}
          value={gender}
          onChange={onChooseGender}
        />
      </View>
    );
  }

  if (open === "birthDate") {
    return (
      <Input
        className="mb-4"
        label={PROFILE_FORM_COPY.birthDateLabel}
        placeholder={PROFILE_FORM_COPY.birthDatePlaceholder}
        keyboardType="number-pad"
        value={birthDate}
        error={birthDateGuide}
        onBlur={() => onTouch("birthDate")}
        onChangeText={onWriteBirthDate}
      />
    );
  }

  if (open === "phone") {
    return (
      <Input
        className="mb-4"
        label={PROFILE_FORM_COPY.phoneLabel}
        placeholder={PROFILE_FORM_COPY.phonePlaceholder}
        keyboardType="number-pad"
        value={phone}
        error={phoneGuide}
        onBlur={() => onTouch("phone")}
        onChangeText={onWritePhone}
      />
    );
  }

  return null;
}
