import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import type { ProfileScreenController } from "@/screens/profile/hooks/useProfileScreen";

export type ProfileFactsProps = {
  screen: ProfileScreenController;
};

export function ProfileFacts({ screen }: ProfileFactsProps) {
  return (
    <View className="mt-6">
      <ListRow
        testID="profile-gender-row"
        title={PROFILE_COPY.genderLabel}
        value={screen.gender}
      />
      <ListRow
        testID="profile-birthdate-row"
        title={PROFILE_COPY.birthDateLabel}
        divider
        value={screen.birthDate}
      />
      <ListRow
        testID="profile-contact-row"
        title={PROFILE_COPY.contactLabel}
        divider
        value={screen.phone}
        valueTone="answer"
        chevron
        onPress={screen.openContact}
      />
    </View>
  );
}
