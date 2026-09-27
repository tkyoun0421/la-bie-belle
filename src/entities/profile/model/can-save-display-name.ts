/**
 * 이름 고치기 시트의 「저장」이 눌리는지를 본다. 근거는
 * `docs/2-design/modules/account/screens/members.md`의 「이름 고치기」다.
 *
 * 막는 것은 둘이다 — 빈 칸과 바뀌지 않은 이름. 앞뒤 공백만 다른 것은 바뀌지 않은 것으로 본다.
 * 서버도 같은 자리에서 공백을 떼고 넣으므로 눌러 봐야 같은 값이 돌아온다.
 *
 * 같은 이름 둘은 안 막는다(`docs/2-design/modules/account/README.md`의 ACC-009) — 중복
 * 검사가 여기 없는 것은 빠뜨린 것이 아니다.
 */
export function canSaveDisplayName(current: string, next: string): boolean {
  const trimmed = next.trim();

  return trimmed !== "" && trimmed !== current.trim();
}
