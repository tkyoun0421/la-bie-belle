import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { MEMBER_LIST_COPY } from "@/entities/member/consts/member.const";
import {
  useMemberRows,
  type MemberRowsInput,
} from "@/entities/member/hooks/useMemberRows";

export type MemberRowsProps = MemberRowsInput & {
  loading?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
  searchEmpty?: ReactNode;
  before?: ReactNode;
  header?: ReactNode;
  more?: ReactNode;
  faded?: boolean;
  className?: string;
};

export function MemberRows({
  loading,
  failed,
  empty,
  searchEmpty,
  before,
  header,
  more,
  faded = false,
  className,
  ...input
}: MemberRowsProps) {
  const fragment = useMemberRows(input);

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
    <>
      {before}

      {fragment.state === "searchEmpty" ? searchEmpty : null}

      {fragment.state === "rows" ? (
        <>
          {header}
          <Card className={className}>
            {fragment.rows.map((row, at) => (
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
                    <Badge
                      variant="brand"
                      label={MEMBER_LIST_COPY.adminBadge}
                    />
                  ) : undefined
                }
                chevron
                divider={at > 0}
                onPress={row.press}
              />
            ))}
            {fragment.canExpand ? more : null}
          </Card>
        </>
      ) : null}
    </>
  );
}
