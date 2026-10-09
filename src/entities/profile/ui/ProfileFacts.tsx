import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { PROFILE_CARD_COPY } from "@/entities/profile/consts/profile.const";

export type ProfileFactsProps = {
  gender: string;
  birthDate: string;
  phone: string;
  onEditContact: () => void;
};

export function ProfileFacts({
  gender,
  birthDate,
  phone,
  onEditContact,
}: ProfileFactsProps) {
  return (
    <View className="mt-6">
      <ListRow
        testID="profile-gender-row"
        title={PROFILE_CARD_COPY.genderLabel}
        value={gender}
      />
      <ListRow
        testID="profile-birthdate-row"
        title={PROFILE_CARD_COPY.birthDateLabel}
        divider
        value={birthDate}
      />
      <ListRow
        testID="profile-contact-row"
        title={PROFILE_CARD_COPY.contactLabel}
        divider
        value={phone}
        valueTone="answer"
        chevron
        onPress={onEditContact}
      />
    </View>
  );
}
