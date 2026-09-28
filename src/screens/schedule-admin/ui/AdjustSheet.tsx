import { View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import {
  adjustRowLabel,
  spellHours,
  type AdjustSheetRow,
} from "@/screens/schedule-admin/model/adjust-sheet-rows";

/**
 * 근무 조정 줄을 누르면 서는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「근무 조정」이고 문안은 같은
 * 문서 「날 상세 문안」의 조정 시트 행들이다.
 *
 * **머리 아래 한 줄이 근태 층을 말한다.** 줄마다 서는 최종 시간은 인증을 안 봐서, 그 층이 따로
 * 있다는 것을 여기서 알린다.
 *
 * **리허설 줄은 누르는 줄 밖에 선다.** 이름 줄과 히트 영역이 겹치면 읽기만 하는 값을 눌러
 * 조정 시트가 열린다 — 관리자는 리허설을 보기만 한다(SCH-020).
 */

const HELP_LINE = "출근 인증이 없는 날은 급여에서 따로 빠져요";

const EMPTY_LINE = "아직 배정된 사람이 없어요";

export type AdjustSheetProps = {
  head: string;
  rows: readonly AdjustSheetRow[];
  onPickPerson: (profileId: string) => void;
};

export function AdjustSheet({ head, rows, onPickPerson }: AdjustSheetProps) {
  return (
    <View>
      <Text size="lg" weight="semibold">
        근무 조정
      </Text>

      <Text size="sm" tone="subtle" numeric className="mt-1">
        {head}
      </Text>

      <Text size="xs" tone="muted" className="mt-1">
        {HELP_LINE}
      </Text>

      {rows.length === 0 ? (
        <Text size="sm" tone="subtle" className="py-4">
          {EMPTY_LINE}
        </Text>
      ) : (
        <View className="mt-2">
          {rows.map((row, at) => (
            <View key={row.profile_id}>
              <ListRow
                title={row.name}
                accessibilityLabel={adjustRowLabel(row)}
                className={row.rehearsalLine === null ? undefined : "pb-1"}
                divider={at > 0}
                chevron
                right={
                  <View className="flex-row items-baseline gap-1">
                    {row.adjustmentKind === null ? null : (
                      <Text size="sm" tone="subtle">
                        {row.adjustmentKind}
                      </Text>
                    )}
                    <Text size="sm" weight="medium" numeric>
                      {spellHours(row.finalMinutes)}
                    </Text>
                  </View>
                }
                onPress={() => onPickPerson(row.profile_id)}
              />
              {row.rehearsalLine === null ? null : (
                <Text size="xs" tone="muted" numeric className="pb-3">
                  {row.rehearsalLine}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
