import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { useAdjustSheet } from "@/features/adjustment/hooks/useAdjustSheet";
import type { AdjustSheetInput } from "@/features/adjustment/model/adjustSheet.type";
import { AdjustRow } from "@/features/adjustment/ui/AdjustRow";

const HELP_LINE = "출근 인증이 없는 날은 급여에서 따로 빠져요";

const EMPTY_LINE = "아직 배정된 사람이 없어요";

export type AdjustSheetProps = AdjustSheetInput;

export function AdjustSheet(props: AdjustSheetProps) {
  const sheet = useAdjustSheet(props);

  return (
    <View>
      <Text size="lg" weight="semibold">
        근무 조정
      </Text>

      <Text size="sm" tone="subtle" numeric className="mt-1">
        {sheet.head}
      </Text>

      {sheet.showHelp ? (
        <Text size="xs" tone="muted" className="mt-1">
          {HELP_LINE}
        </Text>
      ) : null}

      {sheet.isEmpty ? (
        <Text size="sm" tone="subtle" className="py-4">
          {EMPTY_LINE}
        </Text>
      ) : (
        <View className="mt-2">
          {sheet.rows.map((row) => (
            <AdjustRow key={row.profileId} row={row} />
          ))}
        </View>
      )}
    </View>
  );
}
