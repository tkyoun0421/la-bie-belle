import { Mars, Venus } from "lucide-react-native";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { isProfileGender } from "@/entities/profile/model/profile.schema";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import {
  birthYearShort,
  genderSymbol,
  restrictedQualifications,
} from "@/screens/scheduleAdmin/utils/personSheet.utils";

const GENDER_ICON_SIZE = 16;

export type PersonSheetProps = {
  name: string;
  photoUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  qualifications: readonly string[];
};

export function PersonSheet({
  name,
  photoUrl,
  gender,
  birthDate,
  qualifications,
}: PersonSheetProps) {
  const known = isProfileGender(gender) ? gender : null;
  const facts = [
    known === null ? null : spellGender(known),
    birthDate === null ? null : birthYearShort(birthDate),
  ].filter((fact) => fact !== null);
  const earned = restrictedQualifications(qualifications);

  return (
    <View className="items-center">
      <Avatar name={name} photoUrl={photoUrl} size={64} />

      <Text size="lg" weight="semibold" className="mt-3">
        {name}
      </Text>

      {facts.length === 0 ? null : (
        <View className="mt-1 flex-row items-center gap-1">
          {known === null ? null : (
            <Icon
              icon={genderSymbol(known) === "Venus" ? Venus : Mars}
              size={GENDER_ICON_SIZE}
              tone="muted"
            />
          )}
          <Text size="sm" tone="muted" numeric>
            {facts.join(" · ")}
          </Text>
        </View>
      )}

      {earned.length === 0 ? null : (
        <View className="mt-5 w-full">
          <Divider />
          <View className="gap-1 py-3">
            <Text size="sm" tone="subtle">
              자격
            </Text>
            <Text size="sm">{earned.join(" · ")}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
