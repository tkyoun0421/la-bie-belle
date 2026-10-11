import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import type { MemberSummary } from "@/entities/member/model/member.type";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { spellSentLine } from "@/entities/member/utils/elapsedLine.utils";

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

export type MemberWaitRowsController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "ready"; rows: MemberWaitRow[] };

export type PendingRowsController = MemberWaitRowsController;

export function usePendingRows({
  now,
  onPress,
}: PendingRowsInput): PendingRowsController {
  const read = useMembersQuery(supabase, "pending");

  return fragmentOf(read, {
    empty: (members) => members.length === 0,
    ready: (members) => ({
      rows: members.map((row) => ({
        id: row.id,
        name: row.displayName ?? "",
        photoUrl: row.photoUrl,
        detail: spellSentLine(row.submittedAt, now),
        press: () => onPress(row),
      })),
    }),
  });
}
