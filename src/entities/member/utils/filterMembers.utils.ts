/**
 * 프로필 행 더미에서 가입 대기와 차단한 사람을 가른다. 조건은
 * `docs/2-design/modules/account/design.md`의 「가입 승인·거절·차단·해제」가 정본이다.
 *
 * **서버가 걸러 와도 여기서 또 거른다.** 목록을 만드는 조건이 한 곳에만 살아야 두 화면이
 * 같은 뜻으로 「대기 중」을 쓴다. 쿼리는 네트워크를 아끼는 몫이고 무엇이 목록인지를 아는
 * 것은 이 함수다.
 *
 * 열 넷만 보므로 사진이든 연락처든 더 든 행을 그대로 받아 그대로 돌려준다.
 *
 * 정렬은 글자가 아니라 시각으로 견준다. 같은 값이 `…Z`로도 `+00:00`으로도 오는데 글자로
 * 세우면 그 둘의 순서가 갈린다.
 */

/** 이 두 함수가 보는 열 넷이다 — 목록 꼴 전체가 아니라 가르는 조건이 읽는 자리만 든다. */
export type MemberFilterRow = {
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
};

function instantOf(timestamp: string | null): number {
  return timestamp === null ? 0 : Date.parse(timestamp);
}

/** 오래 기다린 사람이 위다 — 새로 온 사람을 위에 두면 오래 기다린 사람이 계속 밀린다. */
export function filterPendingMembers<Row extends MemberFilterRow>(
  rows: readonly Row[],
): Row[] {
  return rows
    .filter(
      (row) =>
        row.submitted_at !== null &&
        row.approved_at === null &&
        row.rejected_at === null &&
        row.blocked_at === null,
    )
    .sort(
      (left, right) =>
        instantOf(left.submitted_at) - instantOf(right.submitted_at),
    );
}

/** 차단은 최근 것이 위다 — 방금 차단한 사람을 다시 찾는 것이 흔한 길이다. */
export function filterBlockedMembers<Row extends MemberFilterRow>(
  rows: readonly Row[],
): Row[] {
  return rows
    .filter((row) => row.blocked_at !== null)
    .sort(
      (left, right) => instantOf(right.blocked_at) - instantOf(left.blocked_at),
    );
}
