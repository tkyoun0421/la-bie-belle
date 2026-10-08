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

export function monthName(month: string): string {
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
