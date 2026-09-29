import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  listActiveMembers,
  listBlockedMembers,
  listLeftMembers,
  listPendingMembers,
  type ActiveMemberRow,
  type MemberListRow,
  type MemberRow,
} from "@/entities/profile/dals/list-members";
import { MEMBERS_KEY } from "@/features/members/model/query-keys";

/**
 * 관리자가 보는 사람 목록 넷을 한 훅으로 읽는다 — 재직·퇴사·가입 대기·차단. 네 목록이 같은
 * 표에서 같은 모양으로 오고 판정 하나가 둘씩 움직이므로(승인은 대기와 재직을, 퇴사는 재직과
 * 퇴사 구획을) 읽는 자리도 하나다.
 *
 * **캐시 키는 `['members', kind]`다.** 접두사가 같아 `['members']` 하나를 무효화하면 넷이
 * 같이 다시 읽히고, 뒤가 갈려 서로를 밀어내지 않는다.
 *
 * 재직·퇴사는 줄과 시트가 개인정보까지 쓰므로 `MemberRow`가 오고, 가입 대기·차단은 그것을 안
 * 세워서 `MemberListRow`가 온다. 재직만 알림 갈래 둘이 더 실린 `ActiveMemberRow`다 — 퇴사
 * 구획에는 그 표시가 안 선다. 어느 쪽이 오는지는 `kind`가 이미 말하고 있어 부르는 쪽이 좁힐
 * 일이 없다.
 */

export type MemberKind = "active" | "left" | "pending" | "blocked";

type RowOf = {
  active: ActiveMemberRow;
  left: MemberRow;
  pending: MemberListRow;
  blocked: MemberListRow;
};

const LIST_OF: {
  [Kind in MemberKind]: (client: Db) => Promise<RowOf[Kind][]>;
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

export function useMembers<Kind extends MemberKind>(
  client: Db,
  kind: Kind,
): MembersResult<RowOf[Kind]> {
  const list = LIST_OF[kind] as (client: Db) => Promise<RowOf[Kind][]>;

  const { data, error, isLoading } = useQuery({
    queryKey: [...MEMBERS_KEY, kind],
    queryFn: () => list(client),
  });

  return { data, error, isLoading };
}
