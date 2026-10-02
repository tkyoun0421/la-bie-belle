import { View } from "react-native";
import type { Theme } from "@/shared/model/theme.type";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import {
  THEME_CHOICES,
  THEME_LABEL,
  THEME_SHEET_TITLE,
} from "@/screens/profile/consts/profile.const";

/**
 * 화면을 고르는 시트다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「화면 고르기」다.
 *
 * **누르는 즉시 바뀌고 닫힌다.** 저장 버튼도 토스트도 없다 — 바뀐 것이 화면 전체라 따로
 * 말할 것이 없고 되돌리는 길은 같은 줄이다. 지금 값인 줄 오른쪽에 체크가 선다
 * (`docs/2-design/design-system/components.md`의 「하나 고르는 목록」).
 */

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
