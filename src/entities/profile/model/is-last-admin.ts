/**
 * 관리자 내리기와 퇴사 처리 버튼을 화면이 미리 잠그는 판정이다. 근거는
 * `docs/2-design/modules/account/README.md`의 ACC-008이다.
 *
 * 셈은 재직 중이고 차단되지 않은 관리자다 — 퇴사하거나 차단된 관리자는 관리자가 아니다.
 *
 * **여기 판정은 버튼을 잠그는 몫뿐이다.** 진짜 벽은 서버의 `is_last_admin`이 누르는 시점에
 * 다시 센다. 관리자 둘이 같은 순간에 서로를 내리면 이 목록은 이미 지난 값이다.
 */

type AdminRow = {
  id: string;
  role: string;
  left_at: string | null;
  blocked_at: string | null;
};

function isActiveAdmin(row: AdminRow): boolean {
  return (
    row.role === "admin" && row.left_at === null && row.blocked_at === null
  );
}

export function isLastAdmin(
  rows: readonly AdminRow[],
  profileId: string,
): boolean {
  const admins = rows.filter(isActiveAdmin);

  return admins.length === 1 && admins[0].id === profileId;
}
