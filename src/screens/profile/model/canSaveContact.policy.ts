import { isValidPhone } from "@/entities/profile/model/validateProfile";

/**
 * 연락처 시트의 「저장」이 켜지는 조건이다. 꼴이 맞고 지금 번호와 달라야 켜진다
 * (`docs/2-design/modules/account/README.md`의 ACC-004,
 * `docs/2-design/modules/account/screens/profile.md`의 「연락처 고치기」).
 *
 * 꼴을 여기서 다시 안 적는 것은 가입할 때 적는 칸과 같은 규칙이기 때문이다 — 둘이 갈리면
 * 한 화면에서 통과한 번호가 다른 화면에서 막힌다.
 *
 * 둘 다 하이픈 없는 숫자다. 하이픈을 넣고 견주면 `01000000001`과 `010-0000-0001`이 다른
 * 번호로 읽힌다.
 */
export function canSaveContact(current: string, draft: string): boolean {
  return draft !== current && isValidPhone(draft);
}
