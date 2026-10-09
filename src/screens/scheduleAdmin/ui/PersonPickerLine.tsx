import { Mars, Venus } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import type { PersonPickerLineView } from "@/screens/scheduleAdmin/model/personPickerSheet.type";

const GENDER_ICON_SIZE = 16;

const AVATAR_SIZE = 40;

export type PersonPickerLineProps = {
  line: PersonPickerLineView;
};

export function PersonPickerLine({ line }: PersonPickerLineProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 py-3"
      onPress={line.press}
      onLongPress={line.inspect}
    >
      <Avatar
        name={line.displayName}
        photoUrl={line.photoUrl}
        size={AVATAR_SIZE}
      />

      <View className="flex-row items-center">
        <Text size="base" weight="medium" tone={line.nameTone}>
          {line.displayName}
        </Text>
        {line.genderIcon === null ? null : (
          <Icon
            icon={line.genderIcon === "Venus" ? Venus : Mars}
            size={GENDER_ICON_SIZE}
            tone={line.genderTone}
            className="ml-1"
          />
        )}
      </View>

      <View className="ml-auto flex-row items-center gap-3">
        {line.message === null ? null : (
          <Text size="xs" tone="subtle">
            {line.message}
          </Text>
        )}
        {line.showCheckbox ? (
          <Checkbox
            label={line.displayName}
            labelHidden
            checked={line.checked}
            onCheckedChange={line.toggle}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
