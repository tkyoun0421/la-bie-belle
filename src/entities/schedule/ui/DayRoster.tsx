import { View } from "react-native";
import { RosterRow } from "@/shared/ui/RosterRow";
import type { RosterRow as RosterRowValue } from "@/entities/schedule/model/daySheet.policy";

export type DayRosterProps = {
  rows: RosterRowValue[];
  myProfileId: string | null;
  myBadge?: string;
};

export function DayRoster({ rows, myProfileId, myBadge }: DayRosterProps) {
  return (
    <View>
      {rows.map((row, at) => {
        const mine = row.kind !== "vacant" && row.profileId === myProfileId;

        return (
          <RosterRow
            key={`${row.position}-${at}`}
            position={
              row.position === rows[at - 1]?.position ? undefined : row.position
            }
            name={row.kind === "vacant" ? undefined : row.displayName}
            training={row.kind === "training"}
            mine={mine}
            badge={mine ? myBadge : undefined}
          />
        );
      })}
    </View>
  );
}
