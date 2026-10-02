import { kstDateOf } from "@/shared/utils/kstDate";

/**
 * 퇴사한 날을 「2026년 6월 30일」로 적는다
 * (`docs/2-design/modules/account/screens/members.md`의 「퇴사한 사람 시트 짜임」).
 *
 * **해가 붙는다.** 퇴사 구획은 해를 넘긴 기록이 쌓이는 자리라, 달과 날만으로는 몇 해 전
 * 것인지가 안 남는다 — 「6월 30일」로 적는 `spellDate`와 갈리는 까닭이다.
 *
 * KST로 옮기는 일은 `kstDateOf`가 한다 — 이 파일이 보정 상수를 다시 들면 그것이 저장소의
 * 몇째 사본이다.
 */
export function spellLeftAt(leftAt: string): string {
  const [year, month, day] = kstDateOf(leftAt).split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}
