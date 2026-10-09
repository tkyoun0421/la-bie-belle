import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { APPROVAL_ROW_COPY } from "@/entities/workRequest/consts/workRequest.const";
import type { ApprovalRow } from "@/entities/workRequest/hooks/useApprovalRows";

export type ApprovalRowsProps = {
  rows: readonly ApprovalRow[];
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
              label={APPROVAL_ROW_COPY.cancelBadge}
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
