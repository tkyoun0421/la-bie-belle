import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
import type { MemberWaitRowsController } from "@/entities/member/hooks/usePendingRows";
import type { MemberSummary } from "@/entities/member/model/member.type";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { spellBlockedLine } from "@/entities/member/utils/elapsedLine.utils";

export type BlockedRowsInput = {
  now: string;
  onPress: (member: MemberSummary) => void;
};

export type BlockedRowsController = MemberWaitRowsController;

export function useBlockedRows({
  now,
  onPress,
}: BlockedRowsInput): BlockedRowsController {
  const read = useMembersQuery(supabase, "blocked");

  return fragmentOf(read, {
    empty: (members) => members.length === 0,
    ready: (members) => ({
      rows: members.map((row) => ({
        id: row.id,
        name: row.displayName ?? "",
        photoUrl: row.photoUrl,
        detail: spellBlockedLine(row.blockedAt, now),
        press: () => onPress(row),
      })),
    }),
  });
}
