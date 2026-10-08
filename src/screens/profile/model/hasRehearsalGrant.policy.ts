const REHEARSAL_POSITION = "리허설";

export type GrantRow = {
  profile_id: string;
  position: string;
};

export function hasRehearsalGrant(
  rows: readonly GrantRow[],
  myProfileId: string | null,
): boolean {
  return (
    myProfileId !== null &&
    rows.some(
      (row) =>
        row.profile_id === myProfileId && row.position === REHEARSAL_POSITION,
    )
  );
}
