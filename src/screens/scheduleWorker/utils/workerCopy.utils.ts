function monthLabel(month: string): number {
  return Number(month.slice(5));
}

export function spellSubmitted(month: string): string {
  return `${monthLabel(month)}월 근무 신청을 보냈어요`;
}

export function spellNotOpen(month: string): string {
  return `아직 ${monthLabel(month)}월 근무 신청을 받지 않아요. 열리면 알려드릴게요`;
}
