import { supabase } from "@/shared/api/supabase";
import type { MemberSummary } from "@/entities/member/model/member.type";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { spellSentLine } from "@/entities/member/utils/elapsedLine.utils";

export type MemberWaitRowsState = "pending" | "failed" | "empty" | "rows";

export type MemberWaitRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  detail: string;
  press: () => void;
};

export type PendingRowsInput = {
  now: string;
  onPress: (member: MemberSummary) => void;
};

export type PendingRowsController = {
  state: MemberWaitRowsState;
  rows: MemberWaitRow[];
};

export function usePendingRows({
  now,
  onPress,
}: PendingRowsInput): PendingRowsController {
  const { data, error } = useMembersQuery(supabase, "pending");

  const rows: MemberWaitRow[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.displayName ?? "",
    photoUrl: row.photoUrl,
    detail: spellSentLine(row.submittedAt, now),
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
