import { HOME_IMMINENT_DEADLINE_DAYS_AHEAD } from "@/shared/config/recruitment.config";

export type ImminentRecruitmentCandidate = {
  scheduleId: string;
  workDate: string;
  applicationDeadline: string;
  applied: boolean;
};

export type ImminentRecruitment = { date: string; applicationDeadline: string; applied: boolean };

function addCalendarDays(date: string, days: number): string {
  const parts = date.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = String(shifted.getUTCFullYear()).padStart(4, "0");
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function selectImminentRecruitment(
  candidates: readonly ImminentRecruitmentCandidate[],
  today: string,
): ImminentRecruitment | null {
  const boundary = addCalendarDays(today, HOME_IMMINENT_DEADLINE_DAYS_AHEAD);

  const withinWindow = candidates.filter(
    (candidate) =>
      candidate.applicationDeadline >= today && candidate.applicationDeadline <= boundary,
  );

  if (withinWindow.length === 0) {
    return null;
  }

  const winner = withinWindow.reduce((earliest, candidate) => {
    if (candidate.applicationDeadline !== earliest.applicationDeadline) {
      return candidate.applicationDeadline < earliest.applicationDeadline ? candidate : earliest;
    }
    return candidate.workDate < earliest.workDate ? candidate : earliest;
  });

  return {
    date: winner.workDate,
    applicationDeadline: winner.applicationDeadline,
    applied: winner.applied,
  };
}
