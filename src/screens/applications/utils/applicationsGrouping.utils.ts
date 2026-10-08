import { kstDateOf, spellDate } from "@/shared/utils/kstDate";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ApplicationRow = {
  profile_id: string;
  work_date: string;
  profiles: { display_name: string | null } | null;
};

export type DateGroup = {
  workDate: string;
  names: string[];
};

export type PersonGroup = {
  profileId: string;
  displayName: string;
  workDates: string[];
};

function nameOf(row: ApplicationRow): string {
  return row.profiles?.display_name ?? "";
}

export function groupApplicationsByDate(
  rows: readonly ApplicationRow[],
): DateGroup[] {
  const byDate = new Map<string, string[]>();

  for (const row of rows) {
    const names = byDate.get(row.work_date) ?? [];

    names.push(nameOf(row));
    byDate.set(row.work_date, names);
  }

  return [...byDate.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([workDate, names]) => ({ workDate, names }));
}

export function groupApplicationsByPerson(
  rows: readonly ApplicationRow[],
): PersonGroup[] {
  const byPerson = new Map<string, PersonGroup>();

  for (const row of rows) {
    const group = byPerson.get(row.profile_id) ?? {
      profileId: row.profile_id,
      displayName: nameOf(row),
      workDates: [],
    };

    group.workDates.push(row.work_date);
    byPerson.set(row.profile_id, group);
  }

  return [...byPerson.values()].map((group) => ({
    ...group,
    workDates: [...group.workDates].sort((one, other) =>
      one.localeCompare(other),
    ),
  }));
}

export function spellApplicationDate(workDate: string): string {
  return spellDate(workDate);
}

export type ApplicationsDeadlineInput = {
  applicationDeadline: string;
  now: string;
};

export function applicationsTitle(month: string): string {
  return `${Number(month.slice(5, 7))}월 근무 신청`;
}

export function applicationsDeadlineLine({
  applicationDeadline,
  now,
}: ApplicationsDeadlineInput): string {
  const [, month, day] = applicationDeadline.split("-").map(Number);
  const remaining = Math.round(
    (Date.parse(`${applicationDeadline}T00:00:00Z`) -
      Date.parse(`${kstDateOf(now)}T00:00:00Z`)) /
      DAY_MS,
  );

  if (remaining < 0) {
    return `${month}월 ${day}일에 마감됐어요`;
  }

  const left = remaining === 0 ? "오늘까지예요" : `${remaining}일 남았어요`;

  return `마감 ${spellApplicationDate(applicationDeadline)} · ${left}`;
}

export function applicationsEmptyDeadlineLine(
  applicationDeadline: string,
): string {
  const [, month, day] = applicationDeadline.split("-").map(Number);

  return `마감은 ${month}월 ${day}일이에요`;
}
