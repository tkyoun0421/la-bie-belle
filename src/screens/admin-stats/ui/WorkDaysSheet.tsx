import { View } from "react-native";
import { Divider } from "@/shared/ui/Divider";
import { Text } from "@/shared/ui/Text";

/**
 * 근무 내역 시트의 속이다. 정본은 `docs/2-design/system/screens/stats.md`의 「근무 내역
 * 시트」고, 이 시트가 답하는 것은 「이 시간이 어느 날들에서 나왔나」 하나다.
 *
 * 줄도 합계도 이미 글월로 와서 여기서는 세로로 쌓기만 한다 — 계산은
 * [`features/stats/model/person-days.ts`](../../../features/stats/model/person-days.ts)가 든다.
 */

export type WorkDaysSheetRow = {
  key: string;
  title: string;
  value: string;
};

export type WorkDaysSheetProps = {
  name: string;
  rows: WorkDaysSheetRow[];
  total: string;
};

export function WorkDaysSheet({ name, rows, total }: WorkDaysSheetProps) {
  return (
    <View>
      <Text size="lg" weight="semibold">
        {name}
      </Text>

      <View className="mt-4">
        {rows.map((row) => (
          <View
            key={row.key}
            className="flex-row items-center justify-between py-3"
          >
            <Text size="sm" tone="muted">
              {row.title}
            </Text>
            <Text size="sm" numeric>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Divider className="mt-2" />

      <Text size="base" weight="medium" numeric className="mt-3">
        {total}
      </Text>
    </View>
  );
}
