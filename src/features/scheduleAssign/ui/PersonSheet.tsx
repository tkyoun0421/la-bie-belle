import { Mars, Venus } from "lucide-react-native";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { usePersonSheet } from "@/features/scheduleAssign/hooks/usePersonSheet";
import type { PersonSheetInput } from "@/features/scheduleAssign/model/personSheet.type";

const GENDER_ICON_SIZE = 16;

const AVATAR_SIZE = 64;

export type PersonSheetProps = PersonSheetInput;

export function PersonSheet(props: PersonSheetProps) {
  const person = usePersonSheet(props);

  return (
    <View className="items-center">
      <Avatar
        name={person.name}
        photoUrl={person.photoUrl}
        size={AVATAR_SIZE}
      />

      <Text size="lg" weight="semibold" className="mt-3">
        {person.name}
      </Text>

      {person.factsLine === null ? null : (
        <View className="mt-1 flex-row items-center gap-1">
          {person.genderIcon === null ? null : (
            <Icon
              icon={person.genderIcon === "Venus" ? Venus : Mars}
              size={GENDER_ICON_SIZE}
              tone="muted"
            />
          )}
          <Text size="sm" tone="muted" numeric>
            {person.factsLine}
          </Text>
        </View>
      )}

      {person.qualificationLine === null ? null : (
        <View className="mt-5 w-full">
          <Divider />
          <View className="gap-1 py-3">
            <Text size="sm" tone="subtle">
              자격
            </Text>
            <Text size="sm">{person.qualificationLine}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
