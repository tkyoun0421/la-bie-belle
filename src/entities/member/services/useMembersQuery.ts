import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  listActiveMembers,
  listBlockedMembers,
  listLeftMembers,
  listPendingMembers,
} from "@/entities/member/api/listMembers.api";
import type {
  ActiveMember,
  Member,
  MemberSummary,
} from "@/entities/member/model/member.type";

export type MemberKind = "active" | "left" | "pending" | "blocked";

type RowOf = {
  active: ActiveMember;
  left: Member;
  pending: MemberSummary;
  blocked: MemberSummary;
};

const LIST_OF: {
  [Kind in MemberKind]: (client: DB) => Promise<RowOf[Kind][]>;
} = {
  active: listActiveMembers,
  left: listLeftMembers,
  pending: listPendingMembers,
  blocked: listBlockedMembers,
};

export type MembersResult<Row> = {
  data: Row[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMembersQuery<Kind extends MemberKind>(
  client: DB,
  kind: Kind,
): MembersResult<RowOf[Kind]> {
  const list = LIST_OF[kind] as (client: DB) => Promise<RowOf[Kind][]>;

  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.member.list(kind),
    queryFn: () => list(client),
  });

  return { data, error, isLoading };
}
