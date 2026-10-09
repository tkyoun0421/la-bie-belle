import type { ReactNode } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { DAY_SHEET_COPY } from "@/entities/rehearsal/consts/rehearsal.const";
import {
  useRehearsalDaySheet,
  type RehearsalDaySheetInput,
} from "@/entities/rehearsal/hooks/useRehearsalDaySheet";

export type RehearsalDaySheetProps = RehearsalDaySheetInput & {
  loading?: ReactNode;
  failed?: ReactNode;
  onPressRow?: (id: string) => void;
  onAdd: () => void;
};

export function RehearsalDaySheet({
  loading,
  failed,
  onPressRow,
  onAdd,
  ...input
}: RehearsalDaySheetProps) {
  const fragment = useRehearsalDaySheet(input);

  if (fragment.state === "pending") {
    return loading ?? null;
  }

  if (fragment.state === "failed") {
    return failed ?? null;
  }

  const { content } = fragment;

  return (
    <View>
      <Text size="lg" weight="semibold">
        {fragment.title}
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

      {fragment.canAdd ? (
        <Button variant="primary" className="mt-4" onPress={onAdd}>
          {DAY_SHEET_COPY.add}
        </Button>
      ) : null}
    </View>
  );
}
