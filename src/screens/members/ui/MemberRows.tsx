import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { MEMBERS_COPY } from "@/screens/members/consts/members.const";
import type { MembersScreenRow } from "@/screens/members/hooks/useMembersScreen";

export type MemberRowsProps = {
  rows: MembersScreenRow[];
  faded?: boolean;
  className?: string;
  children?: ReactNode;
};

export function MemberRows({
  rows,
  faded = false,
  className,
  children,
}: MemberRowsProps) {
  return (
    <Card className={className}>
      {rows.map((row, at) => (
        <ListRow
          key={row.key}
          title={row.displayName}
          detail={row.detail}
          value={row.value}
          left={
            <Avatar
              name={row.displayName}
              photoUrl={row.photoUrl}
              className={faded ? "opacity-60" : undefined}
            />
          }
          right={
            row.isAdmin ? (
              <Badge variant="brand" label={MEMBERS_COPY.adminBadge} />
            ) : undefined
          }
          chevron
          divider={at > 0}
          onPress={row.press}
        />
      ))}
      {children}
    </Card>
  );
}
