import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import {
  usePendingRows,
  type PendingRowsInput,
} from "@/entities/member/hooks/usePendingRows";

export type PendingRowsProps = PendingRowsInput & {
  loading?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function PendingRows({
  loading,
  failed,
  empty,
  ...input
}: PendingRowsProps) {
  const fragment = usePendingRows(input);

  if (fragment.state === "pending") {
    return loading ?? null;
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
          chevron
          divider={at > 0}
          onPress={row.press}
        />
      ))}
    </Card>
  );
}
