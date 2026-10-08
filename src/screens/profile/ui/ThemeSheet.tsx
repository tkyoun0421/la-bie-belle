import { View } from "react-native";
import type { Theme } from "@/shared/model/theme.type";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import {
  THEME_CHOICES,
  THEME_LABEL,
  THEME_SHEET_TITLE,
} from "@/screens/profile/consts/profile.const";

export type ThemeSheetProps = {
  theme: Theme;
  onChoose: (theme: Theme) => void;
};

export function ThemeSheet({ theme, onChoose }: ThemeSheetProps) {
  return (
    <>
      <Text size="lg" weight="semibold">
        {THEME_SHEET_TITLE}
      </Text>

      <View className="mt-2">
        {THEME_CHOICES.map((choice, at) => (
          <ListRow
            key={choice}
            title={THEME_LABEL[choice]}
            selected={choice === theme}
            divider={at > 0}
            onPress={() => onChoose(choice)}
          />
        ))}
      </View>
    </>
  );
}
