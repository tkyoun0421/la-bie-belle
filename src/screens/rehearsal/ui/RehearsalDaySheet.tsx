import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import type { DaySheetContent } from "@/screens/rehearsal/model/day-sheet-rows";

/**
 * 고른 날 하나의 리허설이다. 정본은
 * `docs/2-design/modules/schedule/screens/rehearsal.md`의 「날 시트 짜임」이다.
 *
 * **줄이 하나면 합계를 안 그린다.** 같은 숫자가 두 번 선다.
 *
 * **건수 갈래로 이미 넣은 날에는 「리허설 넣기」가 없다.** 하루 한 줄로 묶여 있어서고
 * (`docs/2-design/modules/schedule/README.md`의 SCH-023) 그 판정은 `canAddOn`이 한다 —
 * 버튼을 남겨두고 누른 뒤에 막으면 왜 막혔는지를 그때 설명해야 한다.
 *
 * **관리자는 줄이 안 눌리고 넣기도 없다.** 남의 리허설을 읽기만 하는 화면이라
 * (`docs/2-design/modules/schedule/README.md`의 SCH-020) 화살표도 누름 배경도 없다.
 *
 * 빈 날은 한 줄이다. 그림도 버튼도 안 세운다 — 넣는 버튼은 시트의 것이라 그대로 있다.
 */

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
