import { kstDateOf } from "@/shared/utils/kstDate";

/**
 * QR 아래 한 줄이다. 지금 코드가 얼마나 오래됐는지가 새로 뽑을지 정하는 유일한 재료라
 * 화면이 드는 것이 이 줄 하나다(`docs/2-design/modules/attendance/screens/qr.md`의
 * 「QR 문안」).
 *
 * **KST로 날을 가른다.** `rotated_at`은 실제 타임스탬프라 UTC로 읽으면 밤 9시 뒤에 돌린
 * 코드가 하루 전으로 선다 — 그 손은 `kstDateOf`가 든다.
 *
 * **연도가 항상 붙는다.** 해를 넘겨 안 바꾼 코드가 있을 수 있고, 그 사실이 바로 판단 재료다
 * (`docs/2-design/design-system/writing.md`의 「숫자와 단위」). 요일이 붙는 `spellDate`를
 * 못 쓰는 까닭이 그것이다.
 */

export function qrStartLine(rotatedAt: string): string {
  const [year, month, day] = kstDateOf(rotatedAt).split("-").map(Number);

  return `${year}년 ${month}월 ${day}일부터 쓰고 있어요`;
}
