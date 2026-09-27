/**
 * 「나」의 리허설 줄과 `/me/rehearsals`의 문이 같이 쓰는 판정이다
 * (`docs/2-design/modules/account/screens/profile.md`의 「리허설」).
 *
 * **새 질의가 없다.** 자격은 `qualifications` 뷰가 이미 끝낸 판정이라
 * (`docs/2-design/modules/schedule/design.md`의 「자격」) 그 결과를 내 것으로 거르기만
 * 한다 — 같은 규칙이 SQL과 TS에 두 벌 서지 않는다.
 */

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
