import type { Qualification } from "@/entities/member/model/member.type";

const REHEARSAL_POSITION = "리허설";

export function hasRehearsalGrant(
  rows: readonly Qualification[],
  myProfileId: string | null,
): boolean {
  return (
    myProfileId !== null &&
    rows.some(
      (row) =>
        row.profileId === myProfileId && row.position === REHEARSAL_POSITION,
    )
  );
}
