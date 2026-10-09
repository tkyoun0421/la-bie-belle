import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";
import type { ApprovalsScreenRow } from "@/screens/approvals/hooks/useApprovalsScreen";

export type ApprovalRowsProps = {
  rows: readonly ApprovalsScreenRow[];
};

export function ApprovalRows({ rows }: ApprovalRowsProps) {
  return (
    <Card className="py-0">
      {rows.map((row, at) => (
        <ListRow
          key={row.id}
          title={row.title}
          detail={row.detail}
          left={
            <Badge
              variant="neutral"
              size="sm"
              label={APPROVALS_COPY.cancelBadge}
            />
          }
          chevron
          divider={at > 0}
          onPress={row.press}
        />
      ))}
    </Card>
  );
}
