/**
 * `/me/rehearsals`의 문이다. **`/admin` 밖의 유일한 조건부 경로다**
 * (`docs/2-design/system/navigation.md`의 「경로」) — 자격이 있는 사람과 관리자만 열고
 * 다른 사람이 주소를 직접 치면 「나」로 보낸다.
 *
 * **읽는 중에는 판정을 미룬다.** 자격을 모르는 동안 화면을 그려두면 아닌 사람에게 한
 * 프레임 비치고, 반대로 그 동안 보내버리면 자격 있는 사람이 제 화면에서 튕긴다 — 딥링크로
 * 바로 들어오는 자리라 둘 다 실제로 일어난다(`resolveAdminGuard`와 같은 결이다).
 */

export type RehearsalGuardInput = {
  isAdmin: boolean;
  hasGrant: boolean;
  isLoading: boolean;
};

export type RehearsalGuardMove = "allow" | "redirect-me" | "wait";

export function resolveRehearsalGuard({
  isAdmin,
  hasGrant,
  isLoading,
}: RehearsalGuardInput): RehearsalGuardMove {
  if (isLoading) {
    return "wait";
  }

  return isAdmin || hasGrant ? "allow" : "redirect-me";
}
