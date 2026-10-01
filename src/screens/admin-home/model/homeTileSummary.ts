/**
 * 근무표 관리 타일 안의 요약 줄이다. 문안 표
 * (`docs/2-design/system/screens/admin-home.md`의 「관리자 홈 문안」) 그대로 세 갈래다 —
 * 아직 없음 · 만드는 중 · 확정 뒤.
 *
 * **이 줄은 근무표 상태 하나만 말한다.** 예전에는 예식 3일 안 빈 자리면 이 줄이 경고로
 * 승격했는데 그러면 하루치만 말할 수 있었다 — 지금은 타일 밖의 빈 자리 카드가 날짜마다
 * 한 장씩 선다(같은 문서의 「빈 자리 경고는 타일 밖으로 나갔다」).
 */

export type HomeTileState = "not_created" | "in_progress" | "confirmed";

export type HomeTileSummaryInput =
  | { state: "not_created"; month: string }
  | {
      state: "in_progress";
      month: string;
      openDays: number;
      vacancyCount: number;
    }
  | { state: "confirmed"; month: string; vacancyCount: number };

function monthName(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

export function homeTileSummary(input: HomeTileSummaryInput): string {
  if (input.state === "not_created") {
    return `${monthName(input.month)} 근무표가 아직 없어요`;
  }

  if (input.state === "confirmed") {
    return `${monthName(input.month)} 근무표를 확정했어요 · 빈 자리 ${input.vacancyCount}`;
  }

  return `${monthName(input.month)} 근무표 · 열린 날 ${input.openDays} · 빈 자리 ${input.vacancyCount}`;
}
