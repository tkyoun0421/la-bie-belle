import { formatElapsedDays } from "@/entities/member/utils/formatElapsedDays.utils";

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
