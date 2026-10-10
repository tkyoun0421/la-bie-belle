import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { MEMBER_LIST_COPY } from "@/entities/member/consts/member.const";
import {
  useBlockedRows,
  type BlockedRowsInput,
} from "@/entities/member/hooks/useBlockedRows";

export type BlockedRowsProps = BlockedRowsInput & {
  pending?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function BlockedRows({
  pending,
  failed,
  empty,
  ...input
}: BlockedRowsProps) {
  const fragment = useBlockedRows(input);

  if (fragment.state === "pending") {
    return pending ?? null;
  }

  if (fragment.state === "failed") {
    return failed ?? null;
  }

  if (fragment.state === "empty") {
    return empty ?? null;
  }

  return (
    <Card className="py-0">
      {fragment.rows.map((row, at) => (
        <ListRow
          key={row.id}
          title={row.name}
          detail={row.detail}
          left={<Avatar name={row.name} photoUrl={row.photoUrl} />}
          right={
            <Button variant="secondary" size="compact" onPress={row.press}>
              {MEMBER_LIST_COPY.unblock}
            </Button>
          }
          divider={at > 0}
        />
      ))}
    </Card>
  );
}
