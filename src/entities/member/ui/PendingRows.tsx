import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { Card } from "@/shared/ui/Card";
import { FragmentView } from "@/shared/ui/FragmentView";
import { ListRow } from "@/shared/ui/ListRow";
import {
  usePendingRows,
  type PendingRowsInput,
} from "@/entities/member/hooks/usePendingRows";

export type PendingRowsProps = PendingRowsInput & {
  pending?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function PendingRows({
  pending,
  failed,
  empty,
  ...input
}: PendingRowsProps) {
  const fragment = usePendingRows(input);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) => (
        <Card className="py-0">
          {ready.rows.map((row, at) => (
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
      )}
    </FragmentView>
  );
}
