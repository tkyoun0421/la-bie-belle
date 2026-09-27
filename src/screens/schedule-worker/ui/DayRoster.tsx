import { View } from "react-native";
import { RosterRow } from "@/shared/ui/RosterRow";
import type { RosterRow as RosterRowValue } from "@/screens/schedule-worker/model/day-sheet";

/**
 * 명단 한 벌이다. 날 시트와 포지션 순 펼침이 같은 구성을 쓴다
 * (`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「날 시트 짜임」).
 *
 * 인증 상태는 아직 안 온다 — `check_ins` 표가 서는 attendance task 뒤에 찬다
 * (`docs/3-build/plans/schedule-worker.md`의 AC-09).
 */

export type DayRosterProps = {
  rows: RosterRowValue[];
  myProfileId: string | null;
};

export function DayRoster({ rows, myProfileId }: DayRosterProps) {
  return (
    <View>
      {rows.map((row, at) => (
        <RosterRow
          key={`${row.position}-${at}`}
          position={
            row.position === rows[at - 1]?.position ? undefined : row.position
          }
          name={row.kind === "vacant" ? undefined : row.displayName}
          training={row.kind === "training"}
          mine={row.kind !== "vacant" && row.profileId === myProfileId}
        />
      ))}
    </View>
  );
}
