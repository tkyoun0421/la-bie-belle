import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { BLOCKED_COPY } from "@/screens/membersPending/consts/membersPending.const";
import type { BlockedRow } from "@/screens/membersPending/hooks/useMembersBlockedScreen";

export type BlockedRowsProps = {
  rows: BlockedRow[];
};

export function BlockedRows({ rows }: BlockedRowsProps) {
  return (
    <Card className="py-0">
      {rows.map((row, at) => (
        <ListRow
          key={row.id}
          title={row.name}
          detail={row.detail}
          left={<Avatar name={row.name} photoUrl={row.photoUrl} />}
          right={
            <Button variant="secondary" size="compact" onPress={row.press}>
              {BLOCKED_COPY.unblock}
            </Button>
          }
          divider={at > 0}
        />
      ))}
    </Card>
  );
}
