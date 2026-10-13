import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import { isLastAdmin } from "@/entities/member/model/isLastAdmin.policy";
import { isLeftOverAYear } from "@/entities/member/model/leftOverAYear.policy";
import type {
  ActiveMember,
  Member,
  MemberRowsEmptyReason,
  MemberRowsKind,
} from "@/entities/member/model/member.type";
import { memberRowsEmptyReason } from "@/entities/member/model/memberRowsEmpty.policy";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { searchMembers } from "@/entities/member/utils/searchMembers.utils";
import { spellLeftAt } from "@/entities/member/utils/spellLeftAt.utils";

export type MemberRow = {
  key: string;
  displayName: string;
  photoUrl: string | null;
  detail: string;
  value: string;
  isAdmin: boolean;
  press: () => void;
};

export type MemberRowsInput = {
  kind: MemberRowsKind;
  query: string;
  now: string;
  expanded: boolean;
  noteOf?: (member: ActiveMember) => string | null;
  onPress: (member: Member, lastAdmin: boolean) => void;
};

export type MemberRowsController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty"; reason: MemberRowsEmptyReason }
  | { state: "ready"; rows: MemberRow[]; canExpand: boolean };

function detailOf(parts: readonly string[]): string {
  return parts.filter((part) => part !== "").join(" ");
}

export function useMemberRows({
  kind,
  query,
  now,
  expanded,
  noteOf,
  onPress,
}: MemberRowsInput): MemberRowsController {
  const active = useMembersQuery(supabase, "active");
  const left = useMembersQuery(supabase, "left");

  const actives = active.data ?? [];
  const lefts = left.data ?? [];

  const foundActive = searchMembers(actives, [], query).active;
  const foundLeft = searchMembers([], lefts, query).left;
  const searching = query.trim() !== "";

  const folded = foundLeft.filter(
    (row) => row.leftAt !== null && isLeftOverAYear(row.leftAt, now),
  );
  const shownLeft =
    searching || expanded
      ? foundLeft
      : foundLeft.filter((row) => !folded.includes(row));

  const press = (row: Member) => () =>
    onPress(row, isLastAdmin(actives, row.id));

  const rows: MemberRow[] =
    kind === "active"
      ? foundActive.map((row) => ({
          key: row.id,
          displayName: row.displayName ?? "",
          photoUrl: row.photoUrl,
          detail: detailOf([row.phone ?? "", noteOf?.(row) ?? ""]),
          value: "",
          isAdmin: row.role === "admin",
          press: press(row),
        }))
      : shownLeft.map((row) => ({
          key: row.id,
          displayName: row.displayName ?? "",
          photoUrl: row.photoUrl,
          detail: "",
          value: row.leftAt === null ? "" : spellLeftAt(row.leftAt),
          isAdmin: false,
          press: press(row),
        }));

  const canExpand = !searching && !expanded && folded.length > 0;

  const reason = memberRowsEmptyReason({
    kind,
    memberCount: actives.length + lefts.length,
    foundCount: foundActive.length + foundLeft.length,
  });

  return fragmentOf([active, left], {
    empty: () => rows.length === 0,
    emptyValue: () => ({ reason }),
    ready: () => ({ rows, canExpand }),
  });
}
