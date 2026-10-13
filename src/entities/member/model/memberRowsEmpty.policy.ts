import type {
  MemberRowsEmptyReason,
  MemberRowsKind,
} from "@/entities/member/model/member.type";

export function memberRowsEmptyReason({
  kind,
  memberCount,
  foundCount,
}: {
  kind: MemberRowsKind;
  memberCount: number;
  foundCount: number;
}): MemberRowsEmptyReason {
  if (kind !== "active") {
    return "noRows";
  }

  if (memberCount === 0) {
    return "noMembers";
  }

  if (foundCount === 0) {
    return "noMatch";
  }

  return "noRows";
}
