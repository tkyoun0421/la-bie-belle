import { Avatar } from "@/shared/ui/Avatar";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import type { PendingRow } from "@/screens/membersPending/hooks/useMembersPendingScreen";

export type PendingRowsProps = {
  rows: PendingRow[];
};

export function PendingRows({ rows }: PendingRowsProps) {
  return (
    <Card className="py-0">
      {rows.map((row, at) => (
        <ListRow
          key={row.id}
          title={row.name}
          detail={row.detail}
          left={<Avatar name={row.name} photoUrl={row.photoUrl} />}
          chevron
          divider={at > 0}
          onPress={row.press}
        />
      ))}
    </Card>
  );
}
