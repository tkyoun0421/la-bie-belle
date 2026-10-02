import { kstClockOf, kstDateOf, spellDate } from "@/shared/utils/kstDate";

/**
 * 가입 신청을 보낸 시각이다 — 「9월 9일(수) 21:04에 보냈어요」
 * (`docs/2-design/modules/account/screens/membersPending.md`의 「상세 시트 짜임」).
 *
 * **목록 줄은 날 수를 말하고 이 줄은 시각을 말한다.** 목록은 「3일 전에 보냈어요」로 급한지를
 * 재는 자리고, 시트는 이 사람이 언제 보냈는지를 그대로 보여주는 자리다.
 *
 * KST로 옮기고 요일을 붙이는 일은 `shared/utils/kstDate.ts`가 한다 — 이 파일이 보정
 * 상수와 요일 표를 다시 들면 저장소의 몇째 사본이다.
 */
export function formatSentAt(submittedAt: string): string {
  return `${spellDate(kstDateOf(submittedAt))} ${kstClockOf(submittedAt)}에 보냈어요`;
}
