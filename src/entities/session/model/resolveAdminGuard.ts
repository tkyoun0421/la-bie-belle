/**
 * `/admin` 아래를 지키는 판정이다. `docs/2-design/system/navigation.md`의 「경로」가 든
 * 「근무자가 `/admin`을 열면 `/`로 보낸다」를 그대로 옮긴다.
 *
 * `resolveAuthDestination`·`resolveGateMove`와 같은 꼴로, 보낼 데가 없으면 null이다 — 지금
 * 자리에 그대로 둔다는 뜻이다.
 *
 * **프로필 행이 없으면 홈이다.** 관리자라는 증거가 없는 것은 관리자가 아닌 것과 같게 본다 —
 * 역할을 모르는 채로 관리자 화면을 그려두면 아닌 사람에게 한 프레임 비친다. 읽는 중인지는
 * 이 함수가 아니라 부르는 쪽이 안다. 다 읽고 나서 물어야 관리자가 제 화면에서 안 튕긴다.
 */

export type AdminStanding = { role: string } | null;

export type AdminGuardMove = "/" | null;

const ADMIN_ROLE = "admin";

export function resolveAdminGuard(profile: AdminStanding): AdminGuardMove {
  return profile?.role === ADMIN_ROLE ? null : "/";
}
