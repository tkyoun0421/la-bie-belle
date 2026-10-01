import type { MemberWageRateRow } from "@/entities/payroll/dals/getWageRates";

/**
 * 시급 목록의 줄을 세운다. 받은 사람 순서를 그대로 둔다 — 이름 가나다순은 목록을 읽는
 * `listActiveMembers`가 이미 세웠고, 개별로 정한 사람을 위로 올리지 않는 것이 이 화면의
 * 규칙이다(wages.md 「사람 줄」).
 *
 * **「가장 최근 행」을 고르는 손이 여기 산다.** 목록의 금액, 기본을 따르는 인원, 되돌리기
 * 줄의 유무가 같은 판정을 쓴다 — 셋이 각자 고르면 셋이 다르게 틀린다.
 *
 * 날짜로 안 자른다. 오늘 이후 행은 함수가 안 만들지만(PAY-008) 이 화면이 답하는 것은
 * 「지금 이 사람의 값이 무엇인가」라 이력의 끝을 그대로 본다.
 *
 * 시급 이력이 빈 사람의 금액은 `null`이다 — 기본 시급이 서기 전에 승인된 자리고, 0원으로
 * 내면 정해진 값처럼 읽힌다.
 */

export type WageRateRow = MemberWageRateRow;

export type WageRowMember = {
  profileId: string;
  displayName: string;
  photoUrl?: string | null;
};

export type WageRow = WageRowMember & {
  amount: number | null;
};

export function latestWageRate(
  rows: readonly WageRateRow[],
): WageRateRow | null {
  return rows.reduce<WageRateRow | null>(
    (kept, row) =>
      kept === null || row.effective_date > kept.effective_date ? row : kept,
    null,
  );
}

export function wageRatesOf(
  rows: readonly WageRateRow[],
  profileId: string,
): WageRateRow[] {
  return rows.filter((row) => row.profile_id === profileId);
}

export function buildWageRows(
  members: readonly WageRowMember[],
  wageRates: readonly WageRateRow[],
): WageRow[] {
  return members.map((member) => ({
    ...member,
    amount:
      latestWageRate(wageRatesOf(wageRates, member.profileId))?.amount ?? null,
  }));
}
