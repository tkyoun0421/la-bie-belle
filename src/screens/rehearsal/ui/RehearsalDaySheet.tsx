import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import type { DaySheetContent } from "@/screens/rehearsal/utils/daySheetRows.utils";

export type RehearsalDaySheetProps = {
  title: string;
  content: DaySheetContent;
  canAdd: boolean;
  onPressRow?: (id: string) => void;
  onAdd: () => void;
};

export function RehearsalDaySheet({
  title,
  content,
  canAdd,
  onPressRow,
  onAdd,
}: RehearsalDaySheetProps) {
  return (
    <View>
      <Text size="lg" weight="semibold">
        {title}
      </Text>

      {content.kind === "empty" ? (
        <Text size="sm" tone="subtle" className="py-6 text-center">
          {content.message}
        </Text>
      ) : (
        <View className="mt-2">
          {content.lines.map((line, at) => (
            <ListRow
              key={line.id}
              testID={`rehearsal-row-${line.id}`}
              title={line.text}
              divider={at > 0}
              chevron={onPressRow !== undefined}
              onPress={
                onPressRow === undefined ? undefined : () => onPressRow(line.id)
              }
            />
          ))}

          {content.totalLine === null ? null : (
            <>
              <Divider className="my-2" />
              <Text size="xs" tone="subtle" numeric className="text-right">
                {content.totalLine}
              </Text>
            </>
          )}
        </View>
      )}

      {canAdd ? (
        <Button variant="primary" className="mt-4" onPress={onAdd}>
          리허설 넣기
        </Button>
      ) : null}
    </View>
  );
}
