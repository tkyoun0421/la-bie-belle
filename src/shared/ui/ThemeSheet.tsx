import { View } from "react-native";
import { useThemeSheet } from "@/shared/hooks/useThemeSheet";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";

export type ThemeSheetProps = {
  onChosen: () => void;
};

export function ThemeSheet({ onChosen }: ThemeSheetProps) {
  const fragment = useThemeSheet(onChosen);

  return (
    <>
      <Text size="lg" weight="semibold">
        {fragment.title}
      </Text>

      <View className="mt-2">
        {fragment.choices.map((choice, at) => (
          <ListRow
            key={choice.value}
            title={choice.label}
            selected={choice.selected}
            divider={at > 0}
            onPress={() => fragment.choose(choice.value)}
          />
        ))}
      </View>
    </>
  );
}
