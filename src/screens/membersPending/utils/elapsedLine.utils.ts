import { formatElapsedDays } from "@/entities/member/utils/formatElapsedDays.utils";

/**
 * 목록 줄의 「언제 그랬나」다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「문안」이다.
 *
 * **날 수가 값인 자리에만 조사가 붙는다.** 「3일 전」은 때를 가리키는 값이라 「3일 전에」가
 * 되고 「오늘」·「어제」는 그 자체가 부사라 조사를 안 받는다 — 그 가름이 화면 둘에 글자까지
 * 같이 있었다.
 *
 * 날 수를 세는 일은 `entities/member`의 손이 한다 — 여기는 그 글자에 말을 붙이는 자리다.
 */

function withParticle(instant: string, now: string, verb: string): string {
  const elapsed = formatElapsedDays(instant, now);

  return elapsed.endsWith("전") ? `${elapsed}에 ${verb}` : `${elapsed} ${verb}`;
}

export function spellSentLine(submittedAt: string | null, now: string): string {
  return submittedAt === null ? "" : withParticle(submittedAt, now, "보냈어요");
}

export function spellBlockedLine(
  blockedAt: string | null,
  now: string,
): string {
  return blockedAt === null ? "" : withParticle(blockedAt, now, "차단했어요");
}
