import { DomainError } from "@/shared/model/error.type";

/**
 * 되돌리기가 기본 시급이 없어 거절당했는지다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`의 「기본으로 되돌리기」다.
 *
 * **평소엔 안 보이는 방어선이다.** 화면이 기본 시급이 없는 동안 되돌리기 줄을 안 그려서,
 * 이 코드가 오는 것은 시트를 연 사이에 기본이 지워진 때뿐이다.
 *
 * 통신이 끊긴 것과 갈라야 해서 `DomainError`인지까지 본다 — 둘이 섞이면 네트워크가 끊긴
 * 자리에서 「기본 시급을 아직 안 정했어요」가 뜬다.
 */
export function isNoDefaultWage(error: Error | null): boolean {
  return error instanceof DomainError && error.code === "no_default_wage";
}
