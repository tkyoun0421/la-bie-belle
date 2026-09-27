/**
 * 직원 화면의 두 목록을 세우는 순서다. 근거는
 * `docs/2-design/modules/account/screens/members.md`의 「재직자 줄」과 「퇴사 구획」이다.
 *
 * **재직자는 가나다순이고 관리자를 위로 안 올린다.** 이 화면에서 관리자와 근무자를 가르는
 * 것은 이름 뒤 배지 하나고, 순서까지 갈리면 찾으려는 이름이 어느 덩이에 있는지를 먼저 알아야
 * 한다. 관리자 전원이 같은 권한이라 위아래도 없다.
 *
 * **퇴사자는 늦게 그만둔 사람이 위다.** 되돌리려고 이 구획을 여는 일이 대부분 방금 처리한
 * 사람을 다시 찾는 것이다.
 *
 * 정렬은 글자가 아니라 시각으로 견준다 — 같은 값이 `…Z`로도 `+00:00`으로도 온다.
 */

type NamedRow = { display_name: string | null };

type LeftRow = { left_at: string | null };

const KOREAN = "ko";

function instantOf(timestamp: string | null): number {
  return timestamp === null ? 0 : Date.parse(timestamp);
}

export function sortActiveMembers<Row extends NamedRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort((left, right) =>
    (left.display_name ?? "").localeCompare(right.display_name ?? "", KOREAN),
  );
}

export function sortLeftMembers<Row extends LeftRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort(
    (left, right) => instantOf(right.left_at) - instantOf(left.left_at),
  );
}

/**
 * 퇴사한 지 1년이 지나 [비워진](../../../../docs/2-design/modules/account/design.md#퇴사-1년-뒤)
 * 사람인지를 본다. 퇴사 구획이 그 선에서 접히고, 접힌 것은 되돌릴 수 없는 사람이다.
 *
 * 꼭 1년째가 지난 쪽이다 — 비우는 일이 그날 돌고 나면 그 사람의 연락처와 사진은 이미 없다.
 */
export function isLeftOverAYear(leftAt: string, today: string): boolean {
  const anniversary = new Date(Date.parse(leftAt));
  anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);

  return Date.parse(today) >= anniversary.getTime();
}
