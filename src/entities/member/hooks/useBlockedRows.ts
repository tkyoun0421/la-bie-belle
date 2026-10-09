import { supabase } from "@/shared/api/supabase";
import type {
  MemberWaitRow,
  MemberWaitRowsState,
} from "@/entities/member/hooks/usePendingRows";
import type { MemberSummary } from "@/entities/member/model/member.type";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { spellBlockedLine } from "@/entities/member/utils/elapsedLine.utils";

export type BlockedRowsInput = {
  now: string;
  onPress: (member: MemberSummary) => void;
};

export type BlockedRowsController = {
  state: MemberWaitRowsState;
  rows: MemberWaitRow[];
};

export function useBlockedRows({
  now,
  onPress,
}: BlockedRowsInput): BlockedRowsController {
  const { data, error } = useMembersQuery(supabase, "blocked");

  const rows: MemberWaitRow[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.displayName ?? "",
    photoUrl: row.photoUrl,
    detail: spellBlockedLine(row.blockedAt, now),
    press: () => onPress(row),
  }));

  function stateOf(): MemberWaitRowsState {
    if (error !== null) {
      return "failed";
    }

    if (data === undefined) {
      return "pending";
    }

    return rows.length === 0 ? "empty" : "rows";
  }

  return { state: stateOf(), rows };
}
